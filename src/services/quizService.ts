import type { BannerType, CategoryIconName, CategorySlug } from '@/constants/theme';
import {
  LOCAL_BANNERS,
  LOCAL_LEADERBOARD_PEERS,
  LOCAL_LEVELS,
  LOCAL_QUESTIONS,
  LOCAL_TOPICS,
} from '@/data/localSeed';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type {
  BannerItem,
  LeaderboardEntry,
  Level,
  LevelProgress,
  Question,
  Topic,
  UserProfile,
} from '@/types/trivia';

export interface CatalogBundle {
  topics: Topic[];
  levels: Level[];
  questions: Question[];
  banners: BannerItem[];
  leaderboard: LeaderboardEntry[];
  source: 'supabase' | 'local';
}

export async function loadCatalogData(): Promise<CatalogBundle> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      topics: LOCAL_TOPICS,
      levels: LOCAL_LEVELS,
      questions: LOCAL_QUESTIONS,
      banners: LOCAL_BANNERS,
      leaderboard: LOCAL_LEADERBOARD_PEERS,
      source: 'local',
    };
  }

  try {
    const [topicsRes, levelsRes, questionsRes, bannersRes, leaderboardRes] = await Promise.all([
      supabase.from('topics').select('*').order('sort_order', { ascending: true }),
      supabase.from('levels').select('*').order('global_order', { ascending: true }),
      supabase.from('questions').select('*').eq('is_active', true),
      supabase.from('banners').select('*').order('orden', { ascending: true }),
      supabase.from('leaderboard_top').select('*').limit(25),
    ]);

    if (topicsRes.error || !topicsRes.data?.length) {
      throw new Error('Fallback to local catalog');
    }

    const topicSlugById = new Map<string, CategorySlug>();
    const topics: Topic[] = topicsRes.data.map((row) => {
      const slug = row.slug as CategorySlug;
      topicSlugById.set(row.id, slug);
      return {
        id: row.id,
        slug,
        title: row.title,
        description: row.description ?? '',
        icon: row.icon as CategoryIconName,
        sortOrder: row.sort_order ?? 0,
        isPremium: Boolean(row.is_premium),
      };
    });

    const levels: Level[] = (levelsRes.data ?? []).map((row) => {
      const topicSlug = topicSlugById.get(row.topic_id) ?? 'nuevo-testamento';
      return {
        id: row.id,
        slug: row.slug ?? `${topicSlug}-nivel-${row.level_number}`,
        topicId: row.topic_id,
        topicSlug,
        levelNumber: row.level_number,
        globalOrder: row.global_order ?? row.level_number,
        title: row.title,
        subtitle: row.subtitle ?? '',
        difficulty: (row.difficulty ?? 1) as 1 | 2 | 3,
        questionsPerRound: row.questions_per_round ?? 5,
        isPremium: Boolean(row.is_premium),
      };
    });

    const questions: Question[] = (questionsRes.data ?? []).map((row) => ({
      id: row.id,
      topicId: row.topic_id,
      topicSlug: topicSlugById.get(row.topic_id) ?? 'nuevo-testamento',
      difficulty: (row.difficulty ?? 1) as 1 | 2 | 3,
      prompt: row.prompt,
      options: row.options as [string, string, string, string],
      correctIndex: row.correct_index as 0 | 1 | 2 | 3,
      explanation: row.explanation,
      sourceRef: row.source_ref ?? '',
    }));

    const banners: BannerItem[] =
      bannersRes.data && bannersRes.data.length > 0
        ? bannersRes.data.map((row) => ({
            id: row.id,
            tipo: row.tipo as BannerType,
            titulo: row.titulo,
            texto: row.texto,
            imagen: row.imagen,
            link: row.link,
            orden: row.orden ?? 0,
          }))
        : LOCAL_BANNERS;

    const leaderboard: LeaderboardEntry[] =
      leaderboardRes.data && leaderboardRes.data.length > 0
        ? leaderboardRes.data.map((row) => ({
            id: row.id,
            displayName: row.display_name,
            xp: row.xp ?? 0,
            streakCount: row.streak_count ?? 0,
          }))
        : LOCAL_LEADERBOARD_PEERS;

    return {
      topics,
      levels: levels.length ? levels : LOCAL_LEVELS,
      questions: questions.length ? questions : LOCAL_QUESTIONS,
      banners,
      leaderboard,
      source: 'supabase',
    };
  } catch {
    return {
      topics: LOCAL_TOPICS,
      levels: LOCAL_LEVELS,
      questions: LOCAL_QUESTIONS,
      banners: LOCAL_BANNERS,
      leaderboard: LOCAL_LEADERBOARD_PEERS,
      source: 'local',
    };
  }
}

export function selectQuestionsForLevel(
  allQuestions: Question[],
  level: Level
): Question[] {
  const byTopic = allQuestions.filter((q) => q.topicId === level.topicId || q.topicSlug === level.topicSlug);
  const exactDiff = byTopic.filter((q) => q.difficulty === level.difficulty);
  const others = byTopic.filter((q) => q.difficulty !== level.difficulty);
  const combined = [...exactDiff, ...others];
  return combined.slice(0, Math.min(level.questionsPerRound, combined.length));
}

export function selectQuestionsForDailyChallenge(
  allQuestions: Question[],
  count: number
): Question[] {
  // Prioriza Nuevo Testamento (Los milagros de Jesús) y completa con el resto de categorías
  const nt = allQuestions.filter((q) => q.topicSlug === 'nuevo-testamento');
  const rest = allQuestions.filter((q) => q.topicSlug !== 'nuevo-testamento');
  const ordered = [...nt, ...rest];
  return ordered.slice(0, Math.min(count, ordered.length));
}

export async function syncProfileToSupabase(profile: UserProfile): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase
      .from('profiles')
      .update({
        display_name: profile.displayName,
        username: profile.username || null,
        is_anonymous: profile.isAnonymous,
        xp: profile.xp,
        streak_count: profile.streakCount,
        longest_streak: profile.longestStreak,
        last_played_date: profile.lastPlayedDate,
        hearts: profile.hearts,
        hearts_updated_at: profile.heartsUpdatedAt,
        games_played_guest: profile.gamesPlayedGuest,
        is_premium: profile.isPremium,
        timer_enabled: profile.timerEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);
  } catch {
    // Persiste localmente de todos modos
  }
}

export async function syncLevelProgressToSupabase(
  userId: string,
  progress: LevelProgress
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('user_level_progress').upsert(
      {
        user_id: userId,
        level_id: progress.levelId,
        best_score: progress.bestScore,
        stars: progress.stars,
        completed_at: progress.completedAt,
      },
      { onConflict: 'user_id,level_id' }
    );
  } catch {
    // Persiste localmente de todos modos
  }
}

export async function sendQuestionReport(
  questionId: string,
  userId: string,
  reason: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from('question_reports').insert({
      question_id: questionId,
      user_id: userId,
      reason: reason.trim(),
    });
  } catch {
    // Reporte guardado en estado local
  }
}
