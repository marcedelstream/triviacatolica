-- ============================================================================
-- Trivia Católica — Migración inicial (MVP + Línea Gráfica "Lienzo")
-- ============================================================================

-- 1. Tópicos / Categorías principales
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  icon text not null,
  color_token text not null default 'cat-nt',
  sort_order int not null default 0,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Niveles del camino por categoría
create table if not exists public.levels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  topic_id uuid not null references public.topics(id) on delete cascade,
  level_number int not null,
  global_order int not null unique,
  title text not null,
  subtitle text,
  difficulty smallint not null check (difficulty between 1 and 3),
  questions_per_round int not null default 5,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  unique(topic_id, level_number)
);

-- 3. Banco de preguntas (generadas por lotes y auditables)
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  difficulty smallint not null check (difficulty between 1 and 3),
  prompt text not null,
  options jsonb not null, -- array de 4 strings: ["A", "B", "C", "D"]
  correct_index smallint not null check (correct_index between 0 and 3),
  explanation text not null,
  source_ref text, -- ej: "CIC 1213" o "Mt 16,18"
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_questions_topic_diff
  on public.questions(topic_id, difficulty)
  where is_active = true;

-- 4. Perfil y progreso del usuario (soporta usuarios anónimos y registrados)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_anonymous boolean not null default true,
  xp int not null default 0,
  streak_count int not null default 0,
  longest_streak int not null default 0,
  last_played_date date,
  hearts int not null default 3,
  hearts_updated_at timestamptz not null default now(),
  games_played_guest int not null default 0,
  is_premium boolean not null default false,
  timer_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Progreso por nivel completado
create table if not exists public.user_level_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  level_id uuid not null references public.levels(id) on delete cascade,
  best_score int not null default 0,
  stars smallint not null default 0 check (stars between 0 and 3),
  completed_at timestamptz not null default now(),
  unique(user_id, level_id)
);

-- 6. Reportes de preguntas (control de calidad doctrinal)
create table if not exists public.question_reports (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- 7. Banners administrables (Oración, Iniciativa, Novedad — Línea Gráfica Lienzo)
create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('oracion', 'iniciativa', 'novedad')),
  titulo text not null,
  texto text not null,
  imagen text,
  link text,
  vigencia_desde timestamptz not null default now(),
  vigencia_hasta timestamptz,
  orden int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Trigger: crear perfil automáticamente al crearse cualquier usuario (incluso anónimo)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, is_anonymous)
  values (new.id, coalesce(new.is_anonymous, true))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Vista pública acotada para Ranking (no expone datos privados)
create or replace view public.leaderboard_top as
select
  id,
  coalesce(nullif(trim(display_name), ''), 'Peregrino') as display_name,
  xp,
  streak_count
from public.profiles
where xp > 0
order by xp desc, streak_count desc
limit 50;

-- ============================================================================
-- Seguridad RLS (Row Level Security)
-- ============================================================================
alter table public.topics enable row level security;
alter table public.levels enable row level security;
alter table public.questions enable row level security;
alter table public.profiles enable row level security;
alter table public.user_level_progress enable row level security;
alter table public.question_reports enable row level security;
alter table public.banners enable row level security;

create policy "Lectura pública de tópicos"
  on public.topics for select using (true);

create policy "Lectura pública de niveles"
  on public.levels for select using (true);

create policy "Lectura pública de preguntas activas"
  on public.questions for select using (is_active = true);

create policy "Lectura pública de banners vigentes"
  on public.banners for select
  using (
    is_active = true
    and vigencia_desde <= now()
    and (vigencia_hasta is null or vigencia_hasta >= now())
  );

create policy "Usuario ve su propio perfil"
  on public.profiles for select using (auth.uid() = id);

create policy "Usuario actualiza su propio perfil"
  on public.profiles for update using (auth.uid() = id);

create policy "Usuario gestiona su progreso"
  on public.user_level_progress
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuario autenticado o anónimo puede reportar"
  on public.question_reports
  for insert with check (auth.uid() = user_id);
