import type { CategorySlug } from '@/constants/theme';
import { LOCAL_DAILY_CHALLENGES } from '@/data/dailyChallengesSeed';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { DailyChallenge, Question } from '@/types/trivia';

export function getTodayDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Índice determinista basado en la fecha calendario (YYYY-MM-DD) para que el desafío
 * de respaldo cambie automáticamente todos los días y todos los usuarios jueguen
 * el mismo desafío en la misma fecha.
 */
function dayIndexFromDateKey(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map((n) => Number.parseInt(n, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return 0;
  }
  const utcDays = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  return Math.abs(utcDays);
}

export function getLocalDailyChallengeForDate(dateKey = getTodayDateKey()): DailyChallenge {
  const exact = LOCAL_DAILY_CHALLENGES.find((c) => c.challengeDate === dateKey);
  if (exact) {
    return exact;
  }
  const idx = dayIndexFromDateKey(dateKey) % LOCAL_DAILY_CHALLENGES.length;
  const picked = LOCAL_DAILY_CHALLENGES[idx] ?? LOCAL_DAILY_CHALLENGES[0];
  return {
    ...picked,
    challengeDate: dateKey,
  };
}

function normalizeRemoteQuestions(raw: unknown, challengeId: string): Question[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((q, idx): Question | null => {
      const prompt = typeof q.prompt === 'string' ? q.prompt.trim() : '';
      const rawOptions = Array.isArray(q.options) ? q.options.map(String) : [];
      const correctRaw =
        typeof q.correctIndex === 'number'
          ? q.correctIndex
          : typeof q.correct_index === 'number'
            ? q.correct_index
            : -1;
      const explanation = typeof q.explanation === 'string' ? q.explanation.trim() : '';
      const sourceRef =
        typeof q.sourceRef === 'string'
          ? q.sourceRef.trim()
          : typeof q.source_ref === 'string'
            ? q.source_ref.trim()
            : '';

      if (!prompt || rawOptions.length !== 4 || correctRaw < 0 || correctRaw > 3) {
        return null;
      }

      return {
        id: typeof q.id === 'string' && q.id ? q.id : `daily-${challengeId}-q-${idx + 1}`,
        topicId:
          typeof q.topicId === 'string'
            ? q.topicId
            : typeof q.topic_id === 'string'
              ? q.topic_id
              : '11111111-1111-4111-8111-111111111102',
        topicSlug: ((typeof q.topicSlug === 'string'
          ? q.topicSlug
          : typeof q.topic_slug === 'string'
            ? q.topic_slug
            : 'nuevo-testamento') as CategorySlug),
        difficulty: ((typeof q.difficulty === 'number' && q.difficulty >= 1 && q.difficulty <= 3
          ? q.difficulty
          : 1) as 1 | 2 | 3),
        prompt,
        options: [rawOptions[0], rawOptions[1], rawOptions[2], rawOptions[3]],
        correctIndex: correctRaw as 0 | 1 | 2 | 3,
        explanation,
        sourceRef,
      };
    })
    .filter((q): q is Question => q !== null);
}

/**
 * Carga el Desafío del Día para la fecha actual (`YYYY-MM-DD`):
 * 1. Consulta `public.daily_challenges` en Supabase (permite programar fechas especiales
 *    y recibir el desafío generado diariamente por Lectura + Evangelio).
 * 2. Si no hay registro para hoy en Supabase (o no hay conexión), usa el banco local
 *    por fecha exacta o rotación automática diaria.
 */
export async function loadTodayDailyChallenge(
  dateKey = getTodayDateKey()
): Promise<DailyChallenge> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('challenge_date', dateKey)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        const questions = normalizeRemoteQuestions(data.questions, data.id);
        if (questions.length > 0) {
          return {
            id: data.id,
            challengeDate: data.challenge_date,
            liturgicalDay: data.liturgical_day ?? 'Desafío del día',
            title: data.title,
            subtitle: data.subtitle ?? '',
            firstReadingRef: data.first_reading_ref ?? '',
            gospelRef: data.gospel_ref ?? '',
            firstReadingText:
              typeof data.first_reading_text === 'string' && data.first_reading_text.trim()
                ? data.first_reading_text.trim()
                : undefined,
            gospelText:
              typeof data.gospel_text === 'string' && data.gospel_text.trim()
                ? data.gospel_text.trim()
                : undefined,
            sourceLabel: data.source_label ?? 'Lectura + Evangelio del día',
            isCustom: Boolean(data.is_custom),
            questions,
          };
        }
      }
    } catch {
      // Fallback automático al banco local
    }
  }

  return getLocalDailyChallengeForDate(dateKey);
}
