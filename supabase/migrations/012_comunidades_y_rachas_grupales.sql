-- ============================================================================
-- Trivia Católica — Migración 012:
-- Comunidades, salas públicas y privadas, rachas grupales, foro estilo canal
-- (solo el creador Pro publica mensajes y quizzes) y reacciones tipo WhatsApp.
--
-- 100% idempotente.
-- ============================================================================

-- 1. Salas / Comunidades
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  is_private boolean not null default false,
  invite_code text unique not null,
  owner_id uuid references public.profiles(id) on delete set null,
  owner_username text not null default 'triviacatolica',
  owner_name text not null default 'Trivia Católica',
  group_streak int not null default 1,
  last_streak_date date,
  member_count int not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists idx_communities_public
  on public.communities(is_private, member_count desc);

-- 2. Miembros de cada comunidad (para racha grupal y acceso a salas privadas)
create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  username text not null default '',
  display_name text not null default 'Peregrino',
  role text not null default 'member' check (role in ('owner', 'member')),
  last_played_date date,
  joined_at timestamptz not null default now(),
  unique(community_id, user_id)
);

-- 3. Publicaciones del foro/canal (SOLO el creador de la sala puede publicar)
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  author_username text not null,
  author_name text not null,
  post_type text not null default 'message' check (post_type in ('message', 'quiz')),
  body text not null,
  quiz_slug text,
  quiz_title text,
  created_at timestamptz not null default now()
);

create index if not exists idx_community_posts_room
  on public.community_posts(community_id, created_at desc);

-- 4. Reacciones tipo WhatsApp (todos los miembros pueden reaccionar)
create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (emoji in ('❤️', '🙏', '🔥', '👏', '👍')),
  created_at timestamptz not null default now(),
  unique(post_id, user_id, emoji)
);

-- Trigger: mantener member_count actualizado
create or replace function public.sync_community_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comm_id uuid := coalesce(new.community_id, old.community_id);
begin
  update public.communities
  set member_count = (
    select count(*)::int from public.community_members where community_id = v_comm_id
  )
  where id = v_comm_id;
  return null;
end;
$$;

drop trigger if exists trg_community_member_count on public.community_members;
create trigger trg_community_member_count
  after insert or delete on public.community_members
  for each row execute function public.sync_community_member_count();

-- RPC: actualizar la racha grupal cuando un miembro juega hoy
create or replace function public.record_community_activity()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := current_date;
  v_yesterday date := current_date - 1;
begin
  if v_uid is null then
    return;
  end if;

  update public.community_members
  set last_played_date = v_today
  where user_id = v_uid;

  update public.communities c
  set
    group_streak = case
      when c.last_streak_date = v_today then c.group_streak
      when c.last_streak_date = v_yesterday then c.group_streak + 1
      else 1
    end,
    last_streak_date = v_today
  where exists (
    select 1 from public.community_members cm
    where cm.community_id = c.id and cm.user_id = v_uid
  );
end;
$$;

grant execute on function public.record_community_activity() to authenticated;

-- RLS
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_reactions enable row level security;

drop policy if exists "Lectura de comunidades públicas y propias" on public.communities;
create policy "Lectura de comunidades públicas y propias"
  on public.communities for select
  using (
    is_private = false
    or owner_id = auth.uid()
    or exists (
      select 1 from public.community_members cm
      where cm.community_id = id and cm.user_id = auth.uid()
    )
    or auth.uid() is not null -- permite buscar por invite_code exacto al unirse
  );

drop policy if exists "Usuarios Pro crean salas" on public.communities;
create policy "Usuarios Pro crean salas"
  on public.communities for insert
  with check (
    auth.uid() = owner_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_premium = true
    )
  );

drop policy if exists "Creador actualiza su sala" on public.communities;
create policy "Creador actualiza su sala"
  on public.communities for update
  using (auth.uid() = owner_id);

drop policy if exists "Miembros leen lista de miembros" on public.community_members;
create policy "Miembros leen lista de miembros"
  on public.community_members for select
  using (auth.uid() is not null);

drop policy if exists "Usuario se une a una sala" on public.community_members;
create policy "Usuario se une a una sala"
  on public.community_members for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuario sale de una sala" on public.community_members;
create policy "Usuario sale de una sala"
  on public.community_members for delete
  using (auth.uid() = user_id);

drop policy if exists "Lectura de posts de comunidades" on public.community_posts;
create policy "Lectura de posts de comunidades"
  on public.community_posts for select
  using (true);

drop policy if exists "Solo el creador publica en su sala" on public.community_posts;
create policy "Solo el creador publica en su sala"
  on public.community_posts for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.communities c
      where c.id = community_id and c.owner_id = auth.uid()
    )
  );

drop policy if exists "Lectura de reacciones" on public.community_reactions;
create policy "Lectura de reacciones"
  on public.community_reactions for select
  using (true);

drop policy if exists "Miembros reaccionan con emojis" on public.community_reactions;
create policy "Miembros reaccionan con emojis"
  on public.community_reactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Miembros quitan su propia reacción" on public.community_reactions;
create policy "Miembros quitan su propia reacción"
  on public.community_reactions for delete
  using (auth.uid() = user_id);

-- Salas públicas iniciales de bienvenida
insert into public.communities (
  id, name, description, is_private, invite_code, owner_username, owner_name, group_streak, member_count
)
values
  (
    '55555555-5555-4555-8555-555555555501',
    'Comunidad Trivia Católica',
    'Sala pública oficial para compartir el Desafío del Día, rachas grupales y quizzes recomendados.',
    false,
    'TRIVIA1',
    'triviacatolica',
    'Equipo Trivia Católica',
    7,
    24
  ),
  (
    '55555555-5555-4555-8555-555555555502',
    'Jóvenes y Catequesis',
    'Quizzes de vida diaria, música católica y santos jóvenes para grupos parroquiales.',
    false,
    'JOVEN26',
    'triviacatolica',
    'Equipo Trivia Católica',
    4,
    15
  )
on conflict (id) do nothing;

insert into public.community_posts (
  id, community_id, author_username, author_name, post_type, body, quiz_slug, quiz_title
)
values
  (
    '66666666-6666-4666-8666-666666666601',
    '55555555-5555-4555-8555-555555555501',
    'triviacatolica',
    'Equipo Trivia Católica',
    'quiz',
    '¡Bienvenidos a la comunidad! Cada vez que jugás una partida ayudás a mantener viva nuestra racha grupal. Probá hoy el Desafío del Día:',
    'desafio-del-dia',
    'Desafío del Día · Lectura y Evangelio'
  ),
  (
    '66666666-6666-4666-8666-666666666602',
    '55555555-5555-4555-8555-555555555502',
    'triviacatolica',
    'Equipo Trivia Católica',
    'quiz',
    '¿Cuántas canciones católicas reconocés solo por una frase? Probá este nuevo modo y reaccioná con 🔥 si te gustó.',
    'canciones-catolicas-clasicos-misa',
    'Adiviná la canción · Clásicos de la Misa'
  )
on conflict (id) do nothing;
