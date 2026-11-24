import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { VersusMatch } from '@/types/trivia';

interface VersusMatchRow {
  id: string;
  challenger_id: string;
  challenger_username: string;
  challenger_name: string;
  opponent_id: string | null;
  opponent_username: string;
  opponent_name: string;
  question_ids: unknown;
  total_questions: number;
  challenger_score: number;
  opponent_score: number | null;
  status: 'waiting_opponent' | 'completed';
  winner: 'challenger' | 'opponent' | 'tie' | null;
  created_at: string;
  completed_at: string | null;
}

function mapRow(row: VersusMatchRow): VersusMatch {
  return {
    id: row.id,
    challengerId: row.challenger_id,
    challengerUsername: row.challenger_username,
    challengerName: row.challenger_name,
    opponentId: row.opponent_id,
    opponentUsername: row.opponent_username,
    opponentName: row.opponent_name,
    questionIds: Array.isArray(row.question_ids) ? row.question_ids.map(String) : [],
    totalQuestions: row.total_questions ?? 5,
    challengerScore: row.challenger_score ?? 0,
    opponentScore: typeof row.opponent_score === 'number' ? row.opponent_score : null,
    status: row.status,
    winner: row.winner ?? null,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export function resolveVersusWinner(
  challengerScore: number,
  opponentScore: number
): 'challenger' | 'opponent' | 'tie' {
  if (challengerScore > opponentScore) return 'challenger';
  if (opponentScore > challengerScore) return 'opponent';
  return 'tie';
}

export async function fetchMyVersusMatches(
  userId: string,
  username?: string
): Promise<VersusMatch[] | null> {
  if (!isSupabaseConfigured || !supabase || !userId) return null;
  try {
    const cleanUser = username?.trim().toLowerCase().replace(/^@/, '') ?? '';
    const orFilter = cleanUser
      ? `challenger_id.eq.${userId},opponent_id.eq.${userId},opponent_username.ilike.${cleanUser}`
      : `challenger_id.eq.${userId},opponent_id.eq.${userId}`;

    const { data, error } = await supabase
      .from('versus_matches')
      .select('*')
      .or(orFilter)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return null;
    return (data as VersusMatchRow[]).map(mapRow);
  } catch {
    return null;
  }
}

export async function fetchVersusMatchById(matchId: string): Promise<VersusMatch | null> {
  if (!isSupabaseConfigured || !supabase || !matchId) return null;
  try {
    const { data, error } = await supabase
      .from('versus_matches')
      .select('*')
      .eq('id', matchId)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as VersusMatchRow);
  } catch {
    return null;
  }
}

async function notifyVersusPush(matchId: string, event: 'challenged' | 'completed'): Promise<void> {
  if (!isSupabaseConfigured || !supabase || matchId.startsWith('local-vs-')) return;
  try {
    await supabase.functions.invoke('notify-versus', {
      body: { matchId, event },
    });
  } catch {
    // Silencioso si la Edge Function aún no está desplegada o el rival no tiene token push
  }
}

export async function createVersusMatchRemote(input: {
  challengerId: string;
  challengerUsername: string;
  challengerName: string;
  opponentId?: string | null;
  opponentUsername: string;
  opponentName: string;
  questionIds: string[];
  totalQuestions: number;
  challengerScore: number;
}): Promise<VersusMatch> {
  const localFallback: VersusMatch = {
    id: `local-vs-${Date.now()}`,
    challengerId: input.challengerId,
    challengerUsername: input.challengerUsername,
    challengerName: input.challengerName,
    opponentId: input.opponentId ?? null,
    opponentUsername: input.opponentUsername,
    opponentName: input.opponentName,
    questionIds: input.questionIds,
    totalQuestions: input.totalQuestions,
    challengerScore: input.challengerScore,
    opponentScore: null,
    status: 'waiting_opponent',
    winner: null,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  if (!isSupabaseConfigured || !supabase) {
    return localFallback;
  }

  try {
    const { data, error } = await supabase
      .from('versus_matches')
      .insert({
        challenger_id: input.challengerId,
        challenger_username: input.challengerUsername,
        challenger_name: input.challengerName,
        opponent_id: input.opponentId ?? null,
        opponent_username: input.opponentUsername,
        opponent_name: input.opponentName,
        question_ids: input.questionIds,
        total_questions: input.totalQuestions,
        challenger_score: input.challengerScore,
        status: 'waiting_opponent',
      })
      .select('*')
      .single();

    if (error || !data) {
      return localFallback;
    }
    const created = mapRow(data as VersusMatchRow);
    void notifyVersusPush(created.id, 'challenged');
    return created;
  } catch {
    return localFallback;
  }
}

export async function completeOpponentVersusTurn(input: {
  match: VersusMatch;
  opponentId: string;
  opponentScore: number;
}): Promise<VersusMatch> {
  const winner = resolveVersusWinner(input.match.challengerScore, input.opponentScore);
  const completedAt = new Date().toISOString();

  const updatedLocal: VersusMatch = {
    ...input.match,
    opponentId: input.match.opponentId ?? input.opponentId,
    opponentScore: input.opponentScore,
    status: 'completed',
    winner,
    completedAt,
  };

  if (!isSupabaseConfigured || !supabase || input.match.id.startsWith('local-vs-')) {
    return updatedLocal;
  }

  try {
    const { data, error } = await supabase
      .from('versus_matches')
      .update({
        opponent_id: input.opponentId,
        opponent_score: input.opponentScore,
        status: 'completed',
        winner,
        completed_at: completedAt,
      })
      .eq('id', input.match.id)
      .select('*')
      .single();

    if (error || !data) {
      return updatedLocal;
    }
    const resolved = mapRow(data as VersusMatchRow);
    void notifyVersusPush(resolved.id, 'completed');
    return resolved;
  } catch {
    return updatedLocal;
  }
}
