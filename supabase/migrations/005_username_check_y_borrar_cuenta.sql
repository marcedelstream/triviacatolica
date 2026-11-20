-- Trivia Católica — Migración 005
-- 1. Consultar si un @usuario está libre (la RLS de profiles solo deja ver el perfil propio)
-- 2. Eliminar la propia cuenta desde la app (requisito de Apple 5.1.1(v) y de Google Play)

create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.profiles
    where username is not null
      and lower(username) = lower(trim(p_username))
      and id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  );
$$;

revoke all on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;

-- Borra al usuario autenticado de auth.users. En cascada se eliminan su perfil
-- y su progreso; los reportes de preguntas quedan anónimos (user_id = null).
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'No hay una sesión activa';
  end if;
  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
