// Supabase Edge Function: sync-vatican-news
// Sincroniza las últimas noticias católicas en español desde múltiples medios
// (Vatican News, ACI Prensa y Aleteia), genera un mini-quiz de 3 preguntas
// con Gemini Structured Outputs para cada noticia nueva y lo guarda en public.news_quizzes.
//
// Secretos requeridos: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const NEWS_FEEDS = [
  { sourceName: 'Vatican News', url: 'https://www.vaticannews.va/es.rss.xml', limit: 2 },
  { sourceName: 'ACI Prensa', url: 'https://www.aciprensa.com/rss/noticias', limit: 2 },
  { sourceName: 'Aleteia', url: 'https://es.aleteia.org/feed/', limit: 2 },
];

interface ParsedRssItem {
  sourceName: string;
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

function inferSection(link: string, sourceName: string): string {
  if (link.includes('/papa/')) return 'El Papa';
  if (link.includes('/vaticano/')) return 'Vaticano';
  if (link.includes('/iglesia/')) return 'Iglesia';
  if (sourceName === 'Aleteia') return 'Fe y cultura';
  return 'Iglesia';
}

function parseRss(xml: string, sourceName: string, limit: number): ParsedRssItem[] {
  const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, limit);
  return matches
    .map((m) => {
      const block = m[1];
      const title = extractTag(block, 'title');
      const link = extractTag(block, 'link');
      const summary = extractTag(block, 'description').slice(0, 240);
      const pubDate = extractTag(block, 'pubDate');
      const enc =
        block.match(/enclosure[^>]*url="([^"]+)"/i) ??
        block.match(/media:content[^>]*url="([^"]+)"/i) ??
        block.match(/media:thumbnail[^>]*url="([^"]+)"/i);

      return {
        sourceName,
        title,
        link,
        summary,
        pubDate,
        imageUrl: enc ? enc[1] : null,
        sectionLabel: inferSection(link, sourceName),
      };
    })
    .filter((item) => Boolean(item.title && item.link));
}

Deno.serve(async () => {
  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.8-flash';

    if (!geminiApiKey || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Faltan secretos GEMINI_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const allItems: ParsedRssItem[] = [];

    for (const feed of NEWS_FEEDS) {
      try {
        const res = await fetch(feed.url);
        if (!res.ok) continue;
        const xml = await res.text();
        allItems.push(...parseRss(xml, feed.sourceName, feed.limit));
      } catch {
        // Si un medio falla temporalmente, continuamos con los demás
      }
    }

    let synced = 0;

    for (const item of allItems) {
      const { data: existing } = await supabase
        .from('news_quizzes')
        .select('id')
        .eq('external_url', item.link)
        .maybeSingle();

      if (existing) continue;

      const prompt = [
        `Creá exactamente 3 preguntas de trivia en español basadas en esta noticia de ${item.sourceName} y su contexto católico:`,
        `Titular: ${item.title}`,
        `Resumen: ${item.summary}`,
        'Reglas:',
        '- 2 preguntas sobre los hechos principales de la noticia y 1 pregunta de doctrina/Biblia relacionada.',
        '- Exactamente 4 opciones claras y sin ambigüedades; correct_index entre 0 y 3.',
        `- Explicación amable de máximo 2 frases y source_ref ("${item.sourceName}" o cita exacta del CIC/Biblia).`,
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
        source_name: item.sourceName,
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

    return new Response(JSON.stringify({ checked: allItems.length, synced }), {
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
