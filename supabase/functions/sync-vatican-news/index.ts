// Supabase Edge Function: sync-vatican-news
// Trae las últimas noticias católicas en español de Vatican News, ACI Prensa (hoy EWTN News
// en español) y Aleteia, genera un mini-quiz de 3 preguntas por noticia nueva con Gemini y lo
// guarda en public.news_quizzes. Siempre deja las 6 noticias más recientes: al entrar una
// nueva se borra la más vieja.
//
// Secretos: GEMINI_API_KEY, CRON_SECRET, GEMINI_MODEL (opcional). SUPABASE_URL y
// SUPABASE_SERVICE_ROLE_KEY los pone Supabase.
// Cada llamada debe mandar el header `x-cron-secret: <CRON_SECRET>`; si no, responde 401.
// Responde 202 y trabaja en segundo plano; con `{ "wait": true }` espera y devuelve el resultado.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MAX_NEWS = 6;
const PER_SOURCE = 2;
// La función tiene 150 s como máximo: no se empieza un quiz nuevo pasados los 100 s
// (lo que quede se completa en la próxima ejecución del cron).
const TIME_BUDGET_MS = 100_000;

const NEWS_FEEDS = [
  { sourceName: 'Vatican News', url: 'https://www.vaticannews.va/es.rss.xml' },
  { sourceName: 'ACI Prensa', url: 'https://www.aciprensa.com/rss/news' },
  { sourceName: 'Aleteia', url: 'https://es.aleteia.org/feed/' },
];

interface ParsedRssItem {
  sourceName: string;
  title: string;
  link: string;
  summary: string;
  publishedAt: string;
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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#039;|&apos;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&#8216;|&#8217;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8230;/g, '…')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) return '';
  return decodeEntities(
    match[1]
      .replace(/<!\[CDATA\[|\]\]>/g, '')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/<[^>]+>/g, ' ')
    .replace(/Leer todo\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferSection(link: string, sourceName: string): string {
  if (link.includes('/papa/')) return 'El Papa';
  if (link.includes('/vaticano/')) return 'Vaticano';
  if (link.includes('/iglesia/')) return 'Iglesia';
  if (link.includes('/mundo/')) return 'Mundo';
  if (sourceName === 'Aleteia') return 'Fe y cultura';
  return 'Iglesia';
}

function toIsoDate(raw: string): string {
  const d = raw ? new Date(raw) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function parseRss(xml: string, sourceName: string): ParsedRssItem[] {
  return [...xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/gi)]
    .map((m) => {
      const block = m[1];
      const link = extractTag(block, 'link');
      const img =
        block.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/i) ??
        block.match(/<media:content[^>]*url="([^"]+)"/i) ??
        block.match(/<media:thumbnail[^>]*url="([^"]+)"/i) ??
        block.match(/<img[^>]*src="([^"]+)"/i);
      return {
        sourceName,
        title: extractTag(block, 'title'),
        link,
        summary: extractTag(block, 'description').slice(0, 240),
        publishedAt: toIsoDate(extractTag(block, 'pubDate')),
        imageUrl: img ? decodeEntities(img[1]) : null,
        sectionLabel: inferSection(link, sourceName),
      };
    })
    .filter((item) => Boolean(item.title && item.link))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

// Compara dos textos en tiempo constante (no revela por timing cuántos caracteres coinciden).
function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

// Lo provee el runtime de Supabase: mantiene viva la función después de responder.
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined;

Deno.serve(async (req: Request) => {
  const cronSecret = Deno.env.get('CRON_SECRET');
  const sentSecret = req.headers.get('x-cron-secret') ?? '';
  if (!cronSecret || !safeEqual(sentSecret, cronSecret)) {
    return json({ error: 'No autorizado.' }, 401);
  }

  const body = await req.json().catch(() => ({}));

  // El cron de Supabase corta la conexión a los 5 s: por defecto se responde 202 al instante
  // y el trabajo sigue en segundo plano (resultado en los Logs).
  if (body?.wait || typeof EdgeRuntime === 'undefined') return await syncNews();
  EdgeRuntime.waitUntil(
    syncNews().then(async (res) => console.log(`sync-vatican-news ${res.status}: ${await res.text()}`))
  );
  return json({ accepted: true }, 202);
});

async function generateQuiz(
  item: ParsedRssItem,
  geminiUrl: string
): Promise<unknown[] | null> {
  const prompt = [
    `Creá exactamente 3 preguntas de trivia en español basadas en esta noticia de ${item.sourceName} y su contexto católico:`,
    `Titular: ${item.title}`,
    `Resumen: ${item.summary}`,
    'Reglas:',
    '- 2 preguntas sobre los hechos principales de la noticia y 1 pregunta de doctrina/Biblia relacionada.',
    '- Exactamente 4 opciones claras y sin ambigüedades; correct_index entre 0 y 3.',
    `- Explicación amable de máximo 2 frases y source_ref ("${item.sourceName}" o cita exacta del CIC/Biblia).`,
  ].join('\n');

  const requestBody = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: QUIZ_SCHEMA, temperature: 0.3 },
  });

  // Gemini a veces responde 503/429 por saturación: hasta 2 intentos.
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(geminiUrl, {
        method: 'POST',
        signal: AbortSignal.timeout(30000),
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
      if (res.ok) {
        const data = await res.json();
        const questions = JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]');
        const valid = Array.isArray(questions)
          ? questions.filter(
              (q) =>
                typeof q?.prompt === 'string' &&
                Array.isArray(q.options) &&
                q.options.length === 4 &&
                Number.isInteger(q.correct_index) &&
                q.correct_index >= 0 &&
                q.correct_index <= 3
            )
          : [];
        return valid.length > 0 ? valid.slice(0, 3) : null;
      }
      console.log(`gemini "${item.title.slice(0, 40)}" intento ${attempt}: HTTP ${res.status}`);
      if (res.status !== 503 && res.status !== 429) return null;
    } catch (err) {
      console.log(`gemini "${item.title.slice(0, 40)}" intento ${attempt}: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  return null;
}

async function syncNews(): Promise<Response> {
  const started = Date.now();
  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.8-flash';
    if (!geminiApiKey || !supabaseUrl || !serviceRoleKey) {
      return json({ error: 'Faltan secretos GEMINI_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.' }, 500);
    }
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Las 2 más recientes de cada medio (si uno falla, se sigue con los demás).
    const feeds = await Promise.all(
      NEWS_FEEDS.map(async (feed) => {
        try {
          const res = await fetch(feed.url, {
            signal: AbortSignal.timeout(10000),
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TriviaCatolicaBot/1.0; +https://triviacatolica.com)' },
          });
          if (!res.ok) {
            console.log(`${feed.sourceName}: HTTP ${res.status}`);
            return [];
          }
          return parseRss(await res.text(), feed.sourceName).slice(0, PER_SOURCE);
        } catch (err) {
          console.log(`${feed.sourceName}: ${err instanceof Error ? err.message : String(err)}`);
          return [];
        }
      })
    );
    const candidates = feeds
      .flat()
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, MAX_NEWS);

    // 2. Solo las que todavía no están cargadas.
    const { data: existingRows } = await supabase
      .from('news_quizzes')
      .select('external_url')
      .in('external_url', candidates.map((c) => c.link));
    const known = new Set((existingRows ?? []).map((r) => r.external_url));
    const fresh = candidates.filter((c) => !known.has(c.link));

    // 3. Quiz con Gemini para cada nueva, de a una y dentro del tiempo disponible.
    let inserted = 0;
    let failed = 0;
    let deferred = 0;
    for (const item of fresh) {
      if (Date.now() - started > TIME_BUDGET_MS) {
        deferred += 1;
        continue;
      }
      const questions = await generateQuiz(item, geminiUrl);
      if (!questions) {
        failed += 1;
        continue;
      }
      const { error } = await supabase.from('news_quizzes').insert({
        external_url: item.link,
        source_name: item.sourceName,
        section_label: item.sectionLabel,
        title: item.title,
        summary: item.summary,
        image_url: item.imageUrl,
        published_at: item.publishedAt,
        questions,
        is_active: true,
      });
      if (error) {
        console.log(`insert "${item.title.slice(0, 40)}": ${error.message}`);
        failed += 1;
      } else {
        inserted += 1;
      }
    }

    // 4. Dejar solo las 6 más recientes: se borran las más viejas.
    let removed = 0;
    const { data: all } = await supabase
      .from('news_quizzes')
      .select('id')
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false });
    const extra = (all ?? []).slice(MAX_NEWS).map((r) => r.id);
    if (extra.length > 0) {
      const { error } = await supabase.from('news_quizzes').delete().in('id', extra);
      if (error) console.log(`borrar viejas: ${error.message}`);
      else removed = extra.length;
    }

    return json({
      ok: true,
      perSource: Object.fromEntries(NEWS_FEEDS.map((f, i) => [f.sourceName, feeds[i].length])),
      candidates: candidates.length,
      inserted,
      failed,
      deferred,
      removed,
      total: Math.min((all ?? []).length, MAX_NEWS),
      ms: Date.now() - started,
    });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Error inesperado' }, 500);
  }
}
