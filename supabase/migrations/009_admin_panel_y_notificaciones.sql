-- ============================================================================
-- Trivia Católica — Migración 009:
-- Panel de administración (app.triviacatolica.com) + Notificaciones Push
--
-- Incluye:
--   1. Tabla public.admin_users + función public.is_admin()
--   2. Columnas extra para lecturas completas en daily_challenges,
--      moderación en question_reports e insignia de sacerdote en profiles
--   3. Políticas RLS de administración en todas las tablas del catálogo
--   4. Tablas public.user_push_tokens y public.notification_campaigns
--
-- 100% idempotente.
-- ============================================================================

-- 1. Administradores autorizados para app.triviacatolica.com
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'admin' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Administrador principal (podés agregar más correos cuando quieras)
insert into public.admin_users (email, role)
values ('marce.escobar22@gmail.com', 'admin')
on conflict (email) do nothing;

-- Vincular user_id automáticamente si la cuenta ya existe en auth.users
update public.admin_users a
set user_id = u.id
from auth.users u
where a.user_id is null
  and lower(a.email) = lower(u.email);

-- Función segura para validar si la sesión actual es administradora
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where (auth.uid() is not null and a.user_id = auth.uid())
       or (
         coalesce(auth.jwt() ->> 'email', '') <> ''
         and lower(a.email) = lower(auth.jwt() ->> 'email')
       )
  );
$$;

grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins leen tabla admin_users" on public.admin_users;
create policy "Admins leen tabla admin_users"
  on public.admin_users for select
  using (public.is_admin());

-- 2. Columnas operativas nuevas
alter table public.daily_challenges
  add column if not exists first_reading_text text,
  add column if not exists gospel_text text;

alter table public.question_reports
  add column if not exists status text not null default 'open'
    check (status in ('open', 'resolved', 'dismissed')),
  add column if not exists resolved_at timestamptz;

alter table public.profiles
  add column if not exists is_verified_priest boolean not null default false;

-- 3. Políticas RLS para que los admins gestionen todo desde app.triviacatolica.com
-- topics
drop policy if exists "Admins gestionan topics" on public.topics;
create policy "Admins gestionan topics"
  on public.topics for all
  using (public.is_admin())
  with check (public.is_admin());

-- levels
drop policy if exists "Admins gestionan levels" on public.levels;
create policy "Admins gestionan levels"
  on public.levels for all
  using (public.is_admin())
  with check (public.is_admin());

-- questions (permite ver también las inactivas)
drop policy if exists "Admins gestionan questions" on public.questions;
create policy "Admins gestionan questions"
  on public.questions for all
  using (public.is_admin())
  with check (public.is_admin());

-- reference_texts
drop policy if exists "Admins gestionan reference_texts" on public.reference_texts;
create policy "Admins gestionan reference_texts"
  on public.reference_texts for all
  using (public.is_admin())
  with check (public.is_admin());

-- daily_challenges (permite ver también inactivos y futuros)
drop policy if exists "Admins gestionan daily_challenges" on public.daily_challenges;
create policy "Admins gestionan daily_challenges"
  on public.daily_challenges for all
  using (public.is_admin())
  with check (public.is_admin());

-- banners (permite ver vencidos/inactivos)
drop policy if exists "Admins gestionan banners" on public.banners;
create policy "Admins gestionan banners"
  on public.banners for all
  using (public.is_admin())
  with check (public.is_admin());

-- news_quizzes
drop policy if exists "Admins gestionan news_quizzes" on public.news_quizzes;
create policy "Admins gestionan news_quizzes"
  on public.news_quizzes for all
  using (public.is_admin())
  with check (public.is_admin());

-- question_reports
drop policy if exists "Admins gestionan question_reports" on public.question_reports;
create policy "Admins gestionan question_reports"
  on public.question_reports for all
  using (public.is_admin())
  with check (public.is_admin());

-- profiles (lectura total y edición operativa de Pro / insignia sacerdote)
drop policy if exists "Admins leen todos los profiles" on public.profiles;
create policy "Admins leen todos los profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Admins actualizan profiles" on public.profiles;
create policy "Admins actualizan profiles"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- 4. Notificaciones Push personalizadas (Expo Push Tokens + Campañas)
create table if not exists public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  platform text not null default 'android' check (platform in ('ios', 'android', 'web')),
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

alter table public.user_push_tokens enable row level security;

drop policy if exists "Usuario registra su propio push token" on public.user_push_tokens;
create policy "Usuario registra su propio push token"
  on public.user_push_tokens for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins leen push tokens" on public.user_push_tokens;
create policy "Admins leen push tokens"
  on public.user_push_tokens for select
  using (public.is_admin());

create table if not exists public.notification_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  deep_link text,
  segment_type text not null default 'all'
    check (segment_type in ('all', 'country', 'username', 'pro', 'free', 'inactive')),
  segment_value text,
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'sent', 'failed')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  sent_count int not null default 0,
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.notification_campaigns enable row level security;

drop policy if exists "Admins gestionan notification_campaigns" on public.notification_campaigns;
create policy "Admins gestionan notification_campaigns"
  on public.notification_campaigns for all
  using (public.is_admin())
  with check (public.is_admin());
