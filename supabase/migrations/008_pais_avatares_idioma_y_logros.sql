-- ============================================================================
-- Trivia Católica — Migración 008:
-- 1. Agrega country (bandera ISO-2), avatar_id (personaje desbloqueado) y language (es/en/pt) a profiles
-- 2. Actualiza vista public.leaderboard_top con country y avatar_id (solo cuentas registradas con @usuario)
-- 3. Actualiza public.get_public_profile(username) con country, avatar_id y perfect_levels
--
-- 100% idempotente: se puede correr más de una vez en el SQL Editor sin problemas.
-- ============================================================================

-- 1. Columnas nuevas en profiles
alter table public.profiles
  add column if not exists country text,
  add column if not exists avatar_id text not null default 'noe',
  add column if not exists language text not null default 'es';

-- 2. Vista pública del Ranking con bandera (country) y avatar (avatar_id)
drop view if exists public.leaderboard_top;

create view public.leaderboard_top as
select
  id,
  coalesce(nullif(trim(display_name), ''), 'Peregrino') as display_name,
  lower(trim(username)) as username,
  upper(nullif(trim(country), '')) as country,
  coalesce(nullif(trim(avatar_id), ''), 'noe') as avatar_id,
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

-- 3. Perfil público de jugador con bandera, avatar y conteo de niveles perfectos
drop function if exists public.get_public_profile(text);

create or replace function public.get_public_profile(p_username text)
returns table (
  id uuid,
  display_name text,
  username text,
  country text,
  avatar_id text,
  xp int,
  streak_count int,
  longest_streak int,
  created_at timestamptz,
  levels_completed int,
  total_stars int,
  perfect_levels int,
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
      coalesce(sum(ulp.stars), 0)::int as total_stars,
      coalesce(count(*) filter (where ulp.stars >= 3), 0)::int as perfect_levels
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
    upper(nullif(trim(t.country), '')) as country,
    coalesce(nullif(trim(t.avatar_id), ''), 'noe') as avatar_id,
    coalesce(t.xp, 0) as xp,
    coalesce(t.streak_count, 0) as streak_count,
    coalesce(t.longest_streak, 0) as longest_streak,
    t.created_at,
    s.levels_completed,
    s.total_stars,
    s.perfect_levels,
    r.rank_position
  from target t
  cross join stats s
  cross join ranking r;
$$;

revoke all on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;
