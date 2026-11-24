-- ============================================================================
-- Trivia Católica — Migración 007:
-- 1. Sincroniza is_anonymous real desde auth.users y libera @usuarios de cuentas anónimas
-- 2. Índice único de @usuario solo sobre cuentas registradas (evita bloqueos fantasma)
-- 3. is_username_available revisa solo cuentas registradas (excluyendo la propia)
-- 4. Fusión segura de cuenta invitada -> cuenta real (borra perfil anónimo duplicado)
-- 5. Vista leaderboard_top: solo cuentas registradas con @usuario + created_at
-- 6. Función get_public_profile(username): perfil público con fecha de ingreso y stats
--
-- 100% idempotente: se puede correr más de una vez en el SQL Editor sin problemas.
-- ============================================================================

-- 1. Sincronizar is_anonymous en profiles con el estado real de auth.users
update public.profiles p
set is_anonymous = coalesce(u.is_anonymous, false)
from auth.users u
where p.id = u.id
  and p.is_anonymous is distinct from coalesce(u.is_anonymous, false);

-- Normalizar usernames vacíos a null
update public.profiles
set username = null
where username is not null
  and trim(username) = '';

-- Liberar cualquier @usuario que haya quedado retenido por cuentas invitadas (anónimas)
update public.profiles
set username = null
where is_anonymous = true
  and username is not null;

-- 2. Índice único de @usuario únicamente sobre cuentas registradas (is_anonymous = false)
drop index if exists public.idx_profiles_username_lower;

create unique index if not exists idx_profiles_username_registered_lower
  on public.profiles (lower(trim(username)))
  where is_anonymous = false
    and username is not null
    and trim(username) <> '';

-- 3. Disponibilidad de @usuario: solo considera ocupado si lo tiene otra cuenta registrada
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p_username is null or trim(p_username) = '' then false
    else not exists (
      select 1
      from public.profiles
      where is_anonymous = false
        and username is not null
        and lower(trim(username)) = lower(trim(p_username))
        and id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
    )
  end;
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

-- 4. Fusión segura de invitado -> cuenta registrada (elimina duplicados al vincular correo/Apple)
create table if not exists public.guest_handoffs (
  guest_id uuid primary key references auth.users(id) on delete cascade,
  token text not null,
  expires_at timestamptz not null
);

alter table public.guest_handoffs enable row level security;

create or replace function public.prepare_guest_handoff()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_is_anon boolean;
  v_token text;
begin
  if v_uid is null then
    return null;
  end if;

  select coalesce(u.is_anonymous, false)
    into v_is_anon
  from auth.users u
  where u.id = v_uid;

  if not coalesce(v_is_anon, false) then
    return null;
  end if;

  v_token := md5(random()::text || clock_timestamp()::text || v_uid::text);

  insert into public.guest_handoffs (guest_id, token, expires_at)
  values (v_uid, v_token, now() + interval '15 minutes')
  on conflict (guest_id) do update set
    token = excluded.token,
    expires_at = excluded.expires_at;

  return jsonb_build_object('guest_id', v_uid, 'token', v_token);
end;
$$;

revoke all on function public.prepare_guest_handoff() from public;
grant execute on function public.prepare_guest_handoff() to authenticated;

create or replace function public.complete_guest_handoff(
  p_guest_id uuid,
  p_token text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_target uuid := auth.uid();
  v_valid boolean;
  v_guest record;
  v_target_prof record;
begin
  if v_target is null or p_guest_id is null or v_target = p_guest_id then
    return false;
  end if;

  select exists (
    select 1
    from public.guest_handoffs
    where guest_id = p_guest_id
      and token = p_token
      and expires_at > now()
  ) into v_valid;

  if not coalesce(v_valid, false) then
    return false;
  end if;

  select * into v_guest from public.profiles where id = p_guest_id;
  select * into v_target_prof from public.profiles where id = v_target;

  -- Fusionar progreso por nivel conservando las mejores estrellas y puntaje
  insert into public.user_level_progress (user_id, level_id, best_score, stars, completed_at)
  select
    v_target,
    g.level_id,
    g.best_score,
    g.stars,
    g.completed_at
  from public.user_level_progress g
  where g.user_id = p_guest_id
  on conflict (user_id, level_id) do update set
    best_score = greatest(public.user_level_progress.best_score, excluded.best_score),
    stars = greatest(public.user_level_progress.stars, excluded.stars),
    completed_at = greatest(public.user_level_progress.completed_at, excluded.completed_at);

  -- Fusionar datos del perfil en la cuenta registrada
  if v_guest is not null and v_target_prof is not null then
    update public.profiles
    set
      is_anonymous = false,
      display_name = case
        when coalesce(nullif(trim(v_target_prof.display_name), ''), 'Peregrino') = 'Peregrino'
             and nullif(trim(v_guest.display_name), '') is not null
        then trim(v_guest.display_name)
        else v_target_prof.display_name
      end,
      xp = greatest(coalesce(v_target_prof.xp, 0), coalesce(v_guest.xp, 0)),
      longest_streak = greatest(coalesce(v_target_prof.longest_streak, 0), coalesce(v_guest.longest_streak, 0)),
      streak_count = greatest(coalesce(v_target_prof.streak_count, 0), coalesce(v_guest.streak_count, 0)),
      last_played_date = greatest(v_target_prof.last_played_date, v_guest.last_played_date),
      updated_at = now()
    where id = v_target;
  end if;

  -- Eliminar el usuario invitado viejo (en cascada borra su perfil y su handoff)
  delete from auth.users where id = p_guest_id and coalesce(is_anonymous, false) = true;

  return true;
end;
$$;

revoke all on function public.complete_guest_handoff(uuid, text) from public;
grant execute on function public.complete_guest_handoff(uuid, text) to authenticated;

-- 5. Vista pública del Ranking: SOLO cuentas registradas con @usuario y actividad (xp > 0)
drop view if exists public.leaderboard_top;

create view public.leaderboard_top as
select
  id,
  coalesce(nullif(trim(display_name), ''), 'Peregrino') as display_name,
  lower(trim(username)) as username,
  xp,
  streak_count,
  longest_streak,
  created_at
from public.profiles
where is_anonymous = false
  and username is not null
  and trim(username) <> ''
  and xp > 0
order by xp desc, streak_count desc, created_at asc
limit 100;

grant select on public.leaderboard_top to anon, authenticated;

-- 6. Perfil público de jugador por @usuario (fecha de ingreso + estadísticas públicas)
create or replace function public.get_public_profile(p_username text)
returns table (
  id uuid,
  display_name text,
  username text,
  xp int,
  streak_count int,
  longest_streak int,
  created_at timestamptz,
  levels_completed int,
  total_stars int,
  rank_position int
)
language sql
stable
security definer
set search_path = public
as $$
  with target as (
    select p.*
    from public.profiles p
    where p.is_anonymous = false
      and p.username is not null
      and lower(trim(p.username)) = lower(trim(p_username))
    limit 1
  ),
  stats as (
    select
      coalesce(count(*) filter (where ulp.stars > 0), 0)::int as levels_completed,
      coalesce(sum(ulp.stars), 0)::int as total_stars
    from public.user_level_progress ulp
    join target t on t.id = ulp.user_id
  ),
  ranking as (
    select
      case
        when t.xp > 0 then (
          select (count(*) + 1)::int
          from public.profiles other
          where other.is_anonymous = false
            and other.username is not null
            and trim(other.username) <> ''
            and other.xp > 0
            and (
              other.xp > t.xp
              or (other.xp = t.xp and other.streak_count > t.streak_count)
              or (other.xp = t.xp and other.streak_count = t.streak_count and other.created_at < t.created_at)
            )
        )
        else null
      end as rank_position
    from target t
  )
  select
    t.id,
    coalesce(nullif(trim(t.display_name), ''), 'Peregrino') as display_name,
    lower(trim(t.username)) as username,
    coalesce(t.xp, 0) as xp,
    coalesce(t.streak_count, 0) as streak_count,
    coalesce(t.longest_streak, 0) as longest_streak,
    t.created_at,
    s.levels_completed,
    s.total_stars,
    r.rank_position
  from target t
  cross join stats s
  cross join ranking r;
$$;

revoke all on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;
