-- ============================================================================
-- Trivia Católica — Migración 010:
-- Modo Versus por turnos (estilo Preguntados, con victoria, derrota o empate)
--
-- Flujo:
--   1. El retador busca a otro jugador por @usuario, responde 5 preguntas
--      y crea el duelo en estado 'waiting_opponent' con las mismas 5 question_ids.
--   2. El rival recibe el duelo en su pantalla de Versus (o por link compartido),
--      responde las mismas 5 preguntas y se resuelve: 'challenger', 'opponent' o 'tie'.
--
-- 100% idempotente.
-- ============================================================================

create table if not exists public.versus_matches (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null references public.profiles(id) on delete cascade,
  challenger_username text not null,
  challenger_name text not null,
  opponent_id uuid references public.profiles(id) on delete set null,
  opponent_username text not null,
  opponent_name text not null,
  question_ids jsonb not null,
  total_questions smallint not null default 5,
  challenger_score smallint not null default 0,
  opponent_score smallint,
  status text not null default 'waiting_opponent'
    check (status in ('waiting_opponent', 'completed')),
  winner text check (winner in ('challenger', 'opponent', 'tie')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_versus_matches_challenger
  on public.versus_matches(challenger_id, created_at desc);

create index if not exists idx_versus_matches_opponent_user
  on public.versus_matches(lower(opponent_username), created_at desc);

alter table public.versus_matches enable row level security;

drop policy if exists "Participantes leen duelos versus" on public.versus_matches;
create policy "Participantes leen duelos versus"
  on public.versus_matches for select
  using (auth.uid() is not null);

drop policy if exists "Retador crea duelo versus" on public.versus_matches;
create policy "Retador crea duelo versus"
  on public.versus_matches for insert
  with check (auth.uid() = challenger_id);

drop policy if exists "Rival completa su turno en versus" on public.versus_matches;
create policy "Rival completa su turno en versus"
  on public.versus_matches for update
  using (
    status = 'waiting_opponent'
    and auth.uid() is not null
    and (
      opponent_id = auth.uid()
      or lower(opponent_username) = lower(
        coalesce((select p.username from public.profiles p where p.id = auth.uid()), '')
      )
    )
  )
  with check (status = 'completed');
