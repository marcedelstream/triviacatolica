import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Community, CommunityPost, CommunityReactionEmoji } from '@/types/trivia';

export const COMMUNITY_EMOJIS: CommunityReactionEmoji[] = ['❤️', '🙏', '🔥', '👏', '👍'];

export function emptyReactionCounts(): Record<CommunityReactionEmoji, number> {
  return { '❤️': 0, '🙏': 0, '🔥': 0, '👏': 0, '👍': 0 };
}

export const LOCAL_SEED_COMMUNITIES: Community[] = [
  {
    id: '55555555-5555-4555-8555-555555555501',
    name: 'Comunidad Trivia Católica',
    description:
      'Sala pública oficial para compartir el Desafío del Día, rachas grupales y quizzes recomendados.',
    isPrivate: false,
    inviteCode: 'TRIVIA1',
    ownerId: null,
    ownerUsername: 'triviacatolica',
    ownerName: 'Equipo Trivia Católica',
    groupStreak: 7,
    lastStreakDate: new Date().toISOString().slice(0, 10),
    memberCount: 24,
    createdAt: '2026-11-15T12:00:00.000Z',
  },
  {
    id: '55555555-5555-4555-8555-555555555502',
    name: 'Jóvenes y Catequesis',
    description:
      'Quizzes de vida diaria, música católica y santos jóvenes para grupos parroquiales.',
    isPrivate: false,
    inviteCode: 'JOVEN26',
    ownerId: null,
    ownerUsername: 'triviacatolica',
    ownerName: 'Equipo Trivia Católica',
    groupStreak: 4,
    lastStreakDate: new Date().toISOString().slice(0, 10),
    memberCount: 15,
    createdAt: '2026-11-18T12:00:00.000Z',
  },
];

export const LOCAL_SEED_COMMUNITY_POSTS: Record<string, CommunityPost[]> = {
  '55555555-5555-4555-8555-555555555501': [
    {
      id: '66666666-6666-4666-8666-666666666601',
      communityId: '55555555-5555-4555-8555-555555555501',
      authorId: null,
      authorUsername: 'triviacatolica',
      authorName: 'Equipo Trivia Católica',
      postType: 'quiz',
      body: '¡Bienvenidos a la comunidad! Cada vez que jugás una partida ayudás a mantener viva nuestra racha grupal. Probá hoy el Desafío del Día:',
      quizSlug: 'desafio-del-dia',
      quizTitle: 'Desafío del Día · Lectura y Evangelio',
      createdAt: '2026-11-24T09:00:00.000Z',
      reactionCounts: { '❤️': 12, '🙏': 9, '🔥': 6, '👏': 4, '👍': 5 },
      myReactions: [],
    },
  ],
  '55555555-5555-4555-8555-555555555502': [
    {
      id: '66666666-6666-4666-8666-666666666602',
      communityId: '55555555-5555-4555-8555-555555555502',
      authorId: null,
      authorUsername: 'triviacatolica',
      authorName: 'Equipo Trivia Católica',
      postType: 'quiz',
      body: '¿Cuántas canciones católicas reconocés solo por una frase? Probá este nuevo modo y reaccioná con 🔥 si te gustó.',
      quizSlug: 'canciones-catolicas-clasicos-misa',
      quizTitle: 'Adiviná la canción · Clásicos de la Misa',
      createdAt: '2026-11-24T10:00:00.000Z',
      reactionCounts: { '❤️': 8, '🙏': 5, '🔥': 11, '👏': 3, '👍': 2 },
      myReactions: [],
    },
  ],
};

function generateInviteCode(name: string): string {
  const prefix = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 4)
    .padEnd(3, 'X');
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}${num}`;
}

interface CommunityRow {
  id: string;
  name: string;
  description: string;
  is_private: boolean;
  invite_code: string;
  owner_id: string | null;
  owner_username: string;
  owner_name: string;
  group_streak: number;
  last_streak_date: string | null;
  member_count: number;
  created_at: string;
}

function mapCommunity(row: CommunityRow): Community {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    isPrivate: Boolean(row.is_private),
    inviteCode: row.invite_code,
    ownerId: row.owner_id,
    ownerUsername: row.owner_username,
    ownerName: row.owner_name,
    groupStreak: row.group_streak ?? 1,
    lastStreakDate: row.last_streak_date,
    memberCount: row.member_count ?? 1,
    createdAt: row.created_at,
  };
}

export async function fetchCommunitiesRemote(
  userId?: string
): Promise<{ communities: Community[]; joinedIds: string[] } | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data: comms, error } = await supabase
      .from('communities')
      .select('*')
      .order('member_count', { ascending: false })
      .limit(50);

    if (error || !comms) return null;

    let joinedIds: string[] = [];
    if (userId) {
      const { data: memberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId);
      joinedIds = (memberships ?? []).map((m) => String(m.community_id));
    }

    const joinedSet = new Set(joinedIds);
    const visible = (comms as CommunityRow[])
      .filter((c) => !c.is_private || c.owner_id === userId || joinedSet.has(c.id))
      .map(mapCommunity);

    return { communities: visible, joinedIds };
  } catch {
    return null;
  }
}

export async function createCommunityRemote(input: {
  name: string;
  description: string;
  isPrivate: boolean;
  ownerId: string;
  ownerUsername: string;
  ownerName: string;
}): Promise<Community> {
  const inviteCode = generateInviteCode(input.name);
  const localFallback: Community = {
    id: `local-comm-${Date.now()}`,
    name: input.name.trim(),
    description: input.description.trim(),
    isPrivate: input.isPrivate,
    inviteCode,
    ownerId: input.ownerId,
    ownerUsername: input.ownerUsername || 'peregrino',
    ownerName: input.ownerName || 'Peregrino',
    groupStreak: 1,
    lastStreakDate: new Date().toISOString().slice(0, 10),
    memberCount: 1,
    createdAt: new Date().toISOString(),
  };

  if (!isSupabaseConfigured || !supabase) return localFallback;

  try {
    const { data, error } = await supabase
      .from('communities')
      .insert({
        name: localFallback.name,
        description: localFallback.description,
        is_private: localFallback.isPrivate,
        invite_code: inviteCode,
        owner_id: input.ownerId,
        owner_username: localFallback.ownerUsername,
        owner_name: localFallback.ownerName,
      })
      .select('*')
      .single();

    if (error || !data) return localFallback;

    const created = mapCommunity(data as CommunityRow);
    await supabase.from('community_members').upsert(
      {
        community_id: created.id,
        user_id: input.ownerId,
        username: localFallback.ownerUsername,
        display_name: localFallback.ownerName,
        role: 'owner',
      },
      { onConflict: 'community_id,user_id' }
    );
    return created;
  } catch {
    return localFallback;
  }
}

export async function joinCommunityRemote(input: {
  communityId: string;
  userId: string;
  username: string;
  displayName: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || input.communityId.startsWith('local-comm-')) {
    return true;
  }
  try {
    const { error } = await supabase.from('community_members').upsert(
      {
        community_id: input.communityId,
        user_id: input.userId,
        username: input.username || '',
        display_name: input.displayName || 'Peregrino',
        role: 'member',
      },
      { onConflict: 'community_id,user_id' }
    );
    return !error;
  } catch {
    return false;
  }
}

export async function findCommunityByCodeRemote(code: string): Promise<Community | null> {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .ilike('invite_code', clean)
      .maybeSingle();
    if (error || !data) return null;
    return mapCommunity(data as CommunityRow);
  } catch {
    return null;
  }
}

export async function fetchCommunityPostsRemote(
  communityId: string,
  userId?: string
): Promise<CommunityPost[] | null> {
  if (!isSupabaseConfigured || !supabase || communityId.startsWith('local-comm-')) return null;
  try {
    const { data: posts, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('community_id', communityId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !posts) return null;
    const postIds = posts.map((p) => p.id);

    const reactionsMap = new Map<
      string,
      { counts: Record<CommunityReactionEmoji, number>; mine: Set<CommunityReactionEmoji> }
    >();

    if (postIds.length > 0) {
      const { data: reactions } = await supabase
        .from('community_reactions')
        .select('post_id, user_id, emoji')
        .in('post_id', postIds);

      for (const r of reactions ?? []) {
        const pid = String(r.post_id);
        const emoji = r.emoji as CommunityReactionEmoji;
        if (!COMMUNITY_EMOJIS.includes(emoji)) continue;
        let bucket = reactionsMap.get(pid);
        if (!bucket) {
          bucket = { counts: emptyReactionCounts(), mine: new Set() };
          reactionsMap.set(pid, bucket);
        }
        bucket.counts[emoji] += 1;
        if (userId && r.user_id === userId) {
          bucket.mine.add(emoji);
        }
      }
    }

    return posts.map((p) => {
      const bucket = reactionsMap.get(p.id);
      return {
        id: p.id,
        communityId: p.community_id,
        authorId: p.author_id,
        authorUsername: p.author_username,
        authorName: p.author_name,
        postType: p.post_type === 'quiz' ? 'quiz' : 'message',
        body: p.body,
        quizSlug: p.quiz_slug ?? null,
        quizTitle: p.quiz_title ?? null,
        createdAt: p.created_at,
        reactionCounts: bucket ? bucket.counts : emptyReactionCounts(),
        myReactions: bucket ? Array.from(bucket.mine) : [],
      };
    });
  } catch {
    return null;
  }
}

export async function publishCommunityPostRemote(input: {
  communityId: string;
  authorId: string;
  authorUsername: string;
  authorName: string;
  postType: 'message' | 'quiz';
  body: string;
  quizSlug?: string | null;
  quizTitle?: string | null;
}): Promise<CommunityPost> {
  const localPost: CommunityPost = {
    id: `local-post-${Date.now()}`,
    communityId: input.communityId,
    authorId: input.authorId,
    authorUsername: input.authorUsername || 'peregrino',
    authorName: input.authorName || 'Peregrino',
    postType: input.postType,
    body: input.body.trim(),
    quizSlug: input.quizSlug ?? null,
    quizTitle: input.quizTitle ?? null,
    createdAt: new Date().toISOString(),
    reactionCounts: emptyReactionCounts(),
    myReactions: [],
  };

  if (!isSupabaseConfigured || !supabase || input.communityId.startsWith('local-comm-')) {
    return localPost;
  }

  try {
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        community_id: input.communityId,
        author_id: input.authorId,
        author_username: localPost.authorUsername,
        author_name: localPost.authorName,
        post_type: input.postType,
        body: localPost.body,
        quiz_slug: localPost.quizSlug,
        quiz_title: localPost.quizTitle,
      })
      .select('*')
      .single();

    if (error || !data) return localPost;
    return {
      ...localPost,
      id: data.id,
      createdAt: data.created_at,
    };
  } catch {
    return localPost;
  }
}

export async function togglePostReactionRemote(input: {
  postId: string;
  userId: string;
  emoji: CommunityReactionEmoji;
  currentlyActive: boolean;
}): Promise<void> {
  if (!isSupabaseConfigured || !supabase || input.postId.startsWith('local-post-')) return;
  try {
    if (input.currentlyActive) {
      await supabase
        .from('community_reactions')
        .delete()
        .eq('post_id', input.postId)
        .eq('user_id', input.userId)
        .eq('emoji', input.emoji);
    } else {
      await supabase.from('community_reactions').upsert(
        {
          post_id: input.postId,
          user_id: input.userId,
          emoji: input.emoji,
        },
        { onConflict: 'post_id,user_id,emoji' }
      );
    }
  } catch {
    // Mantiene el estado optimista local
  }
}

export async function recordCommunityStreakRemote(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.rpc('record_community_activity');
  } catch {
    // Silencioso si Migración 012 aún no se ejecutó
  }
}
