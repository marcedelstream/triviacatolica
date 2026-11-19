-- ============================================================================
-- Trivia Católica — Migración 002: Noticias de Vatican News con mini-quiz
-- ============================================================================

create table if not exists public.news_quizzes (
  id uuid primary key default gen_random_uuid(),
  external_url text unique not null,
  section_label text not null default 'Vaticano',
  title text not null,
  summary text not null,
  image_url text,
  published_at timestamptz not null default now(),
  questions jsonb not null, -- Array de 3 preguntas: [{ prompt, options, correct_index, explanation, source_ref }]
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_news_quizzes_published
  on public.news_quizzes(published_at desc)
  where is_active = true;

alter table public.news_quizzes enable row level security;

create policy "Lectura pública de quizzes de noticias activas"
  on public.news_quizzes for select
  using (is_active = true);
