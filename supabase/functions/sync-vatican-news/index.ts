// Supabase Edge Function: sync-vatican-news
// Lee el RSS oficial en español de Vatican News (https://www.vaticannews.va/es.rss.xml),
// genera un mini-quiz de 3 preguntas con Gemini Structured Outputs para cada noticia nueva
// y lo guarda en public.news_quizzes.
//
// Programable con pg_cron una o dos veces al día.
// Secretos requeridos: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VATICAN_NEWS_RSS = 'https://www.vaticannews.va/es.rss.xml';

interface ParsedRssItem {
  title: string;
  link: string;
  summary: string;
  pubDate: string;
  imageUrl: string | null;
  sectionLabel: string;
}

const QUIZ_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      prompt: { type: 'STRING' },
      options: { type: 'ARRAY', items: { type: 'STRING' } },
      correct_index: { type: 'INTEGER' },
      explanation: { type: 'STRING' },
      source_ref: { type: 'STRING' },
    },
    required: ['prompt', 'options', 'correct_index', 'explanation', 'source_ref'],
  },
};

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) return '';
  return match[1]
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/Leer todo\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferSection(link: string): string {
  if (link.includes('/es/papa/')) return 'El Papa';
  if (link.includes('/es/vaticano/')) return 'Vaticano';
  if (link.includes('/es/iglesia/')) return 'Iglesia';
  return 'Mundo';
}

function parseRss(xml: string, limit = 5): ParsedRssItem[] {
  const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, limit);
  return matches
    .map((m) => {
      const block = m[1];
      const title = extractTag(block, 'title');
      const link = extractTag(block, 'link');
      const summary = extractTag(block, 'description');
      const pubDate = extractTag(block, 'pubDate');
      const enc =
        block.match(/enclosure[^>]*url="([^"]+)"/i) ??
        block.match(/media:content[^>]*url="([^"]+)"/i);

      return {
        title,
        link,
        summary,
        pubDate,
        imageUrl: enc ? enc[1] : null,
        sectionLabel: inferSection(link),
      };
    })
    .filter((item) => Boolean(item.title && item.link));
}

Deno.serve(async (req: Request) => {
  try {
    const { limit = 4 } = await req.json().catch(() => ({}));
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';

    if (!geminiApiKey || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Faltan secretos GEMINI_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rssRes = await fetch(VATICAN_NEWS_RSS);
    if (!rssRes.ok) {
      return new Response(JSON.stringify({ error: 'No se pudo descargar el RSS de Vatican News.' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rssText = await rssRes.text();
    const items = parseRss(rssText, Math.min(Number(limit) || 4, 8));
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let synced = 0;

    for (const item of items) {
      // Evitar regenerar noticias ya guardadas
      const { data: existing } = await supabase
        .from('news_quizzes')
        .select('id')
        .eq('external_url', item.link)
        .maybeSingle();

      if (existing) continue;

      const prompt = [
        'Creá exactamente 3 preguntas de trivia en español basadas en esta noticia de Vatican News y su contexto católico:',
        `Titular: ${item.title}`,
        `Resumen: ${item.summary}`,
        'Reglas:',
        '- 2 preguntas sobre los hechos principales de la noticia y 1 pregunta de cultura/doctrina católica relacionada con el tema.',
        '- Exactamente 4 opciones claras y sin ambigüedades; correct_index entre 0 y 3.',
        '- Explicación amable de máximo 2 frases y source_ref ("Vatican News" o cita del CIC/Biblia).',
      ].join('\n');

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: QUIZ_SCHEMA,
              temperature: 0.3,
            },
          }),
        }
      );

      if (!geminiRes.ok) continue;
      const geminiJson = await geminiRes.json();
      const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
      const questions = JSON.parse(rawText);

      if (!Array.isArray(questions) || questions.length === 0) continue;

      const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();

      const { error } = await supabase.from('news_quizzes').insert({
        external_url: item.link,
        section_label: item.sectionLabel,
        title: item.title,
        summary: item.summary,
        image_url: item.imageUrl,
        published_at: publishedAt,
        questions,
        is_active: true,
      });

      if (!error) synced += 1;
    }

    return new Response(JSON.stringify({ checked: items.length, synced }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error inesperado' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
