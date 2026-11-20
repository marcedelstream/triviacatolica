import { LOCAL_VATICAN_NEWS } from '@/data/vaticanNewsSeed';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { Question, VaticanNewsQuizItem } from '@/types/trivia';

export const VATICAN_NEWS_PORTAL_URL = 'https://www.vaticannews.va/es.html';

export async function loadVaticanNewsQuizzes(): Promise<VaticanNewsQuizItem[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('news_quizzes')
        .select('*')
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .limit(6);

      if (!error && data && data.length > 0) {
        return data.map((row) => {
          const rawQuestions = Array.isArray(row.questions) ? row.questions : [];
          const questions: Question[] = rawQuestions.map(
            (
              q: {
                prompt: string;
                options: [string, string, string, string];
                correct_index: number;
                explanation: string;
                source_ref?: string;
              },
              idx: number
            ) => ({
              id: `${row.id}-q-${idx}`,
              topicId: 'vatican-news',
              topicSlug: 'liturgia',
              difficulty: 1,
              prompt: q.prompt,
              options: q.options,
              correctIndex: q.correct_index as 0 | 1 | 2 | 3,
              explanation: q.explanation,
              sourceRef: q.source_ref ?? 'Vatican News',
            })
          );

          return {
            id: row.id,
            sourceName: row.source_name ?? 'Vatican News',
            sectionLabel: row.section_label ?? 'Iglesia',
            title: row.title,
            summary: row.summary,
            url: row.external_url,
            imageUrl: row.image_url,
            publishedAt: row.published_at,
            questions,
          };
        });
      }
    } catch {
      // Fallback transparente a noticias locales precargadas
    }
  }

  return LOCAL_VATICAN_NEWS;
}
