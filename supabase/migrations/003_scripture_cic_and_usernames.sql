-- ============================================================================
-- Trivia Católica — Migración 003:
-- 1. Nombre de usuario (@username) en profiles + vista leaderboard_top
-- 2. Medio / fuente en news_quizzes (Vatican News, ACI Prensa, Aleteia)
-- 3. Tabla reference_texts para Biblia Católica completa y Catecismo (CIC)
-- ============================================================================

-- 1. Username único para desafíos y ranking
alter table public.profiles
  add column if not exists username text;

create unique index if not exists idx_profiles_username_lower
  on public.profiles (lower(username))
  where username is not null;

create or replace view public.leaderboard_top as
select
  id,
  coalesce(nullif(trim(display_name), ''), 'Peregrino') as display_name,
  username,
  xp,
  streak_count
from public.profiles
where xp > 0
order by xp desc, streak_count desc
limit 50;

grant select on public.leaderboard_top to anon, authenticated;

-- 2. Fuente de noticia en news_quizzes (Vatican News, ACI Prensa, Aleteia, etc.)
alter table public.news_quizzes
  add column if not exists source_name text not null default 'Vatican News';

-- 3. Banco consultable de textos completos: Biblia Católica y Catecismo (CIC)
create table if not exists public.reference_texts (
  id uuid primary key default gen_random_uuid(),
  ref_key text unique not null, -- ej: "CIC 1219", "Gn 6,14", "Jn 2,1-11"
  source_type text not null check (source_type in ('biblia', 'cic', 'igmr', 'otro')),
  title text not null,
  body text not null,
  book_or_section text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reference_texts_key
  on public.reference_texts (lower(ref_key));

alter table public.reference_texts enable row level security;

drop policy if exists "Lectura pública de textos de referencia" on public.reference_texts;
create policy "Lectura pública de textos de referencia"
  on public.reference_texts for select using (true);
