// Supabase Edge Function: sync-daily-challenge
// Obtiene la Primera Lectura y el Evangelio del día en español (Vatican News / Evangelio del día),
// genera un desafío de 5 preguntas fieles a las lecturas y al CIC con Gemini Structured Outputs,
// y lo guarda en `public.daily_challenges` para esa fecha.
//
// Respeta desafíos programados manualmente: si la fecha ya tiene un registro con `is_custom = true`
// (por ejemplo, una solemnidad o campaña especial cargada desde el panel), NO lo sobrescribe
// a menos que se pase `{ force: true }`.
//
// Despliegue: supabase functions deploy sync-daily-challenge
// Cron sugerido: todos los días a las 03:00 UTC (00:00 AR/UY/CL)
// Secretos requeridos: GEMINI_API_KEY, CRON_SECRET (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase)
// Cada llamada debe mandar el header `x-cron-secret: <CRON_SECRET>`; si no, responde 401.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface GeneratedDailyPayload {
  liturgical_day: string;
  title: string;
  subtitle: string;
  first_reading_ref: string;
  gospel_ref: string;
  questions: Array<{
    prompt: string;
    options: [string, string, string, string];
    correct_index: number;
    explanation: string;
    source_ref: string;
    difficulty: number;
    topic_slug: string;
  }>;
}

const DAILY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    liturgical_day: { type: 'STRING' },
    title: { type: 'STRING' },
    subtitle: { type: 'STRING' },
    first_reading_ref: { type: 'STRING' },
    gospel_ref: { type: 'STRING' },
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          prompt: { type: 'STRING' },
          options: { type: 'ARRAY', items: { type: 'STRING' } },
          correct_index: { type: 'INTEGER' },
          explanation: { type: 'STRING' },
          source_ref: { type: 'STRING' },
          difficulty: { type: 'INTEGER' },
          topic_slug: { type: 'STRING' },
        },
        required: [
          'prompt',
          'options',
          'correct_index',
          'explanation',
          'source_ref',
          'difficulty',
          'topic_slug',
        ],
      },
    },
  },
  required: [
    'liturgical_day',
    'title',
    'subtitle',
    'first_reading_ref',
    'gospel_ref',
    'questions',
  ],
};

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchReadingsText(dateKey: string): Promise<string | null> {
  const [y, m, d] = dateKey.split('-');
  const candidateUrls = [
    `https://www.vaticannews.va/es/evangelio-de-hoy/${y}/${m}/${d}.html`,
    'https://www.vaticannews.va/es/evangelio-de-hoy.html',
  ];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'TriviaCatolicaBot/1.0 (+https://triviacatolica.com)' },
      });
      if (!res.ok) continue;
      const html = await res.text();
      // Extraer el bloque principal de lecturas del día si existe
      const mainMatch =
        html.match(/<section[^>]*class="[^"]*section--evidence[^"]*"[^>]*>([\s\S]*?)<\/section>/i) ??
        html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      const text = stripHtml(mainMatch ? mainMatch[1] : html);
      if (text.length > 300) {
        return text.slice(0, 6500);
      }
    } catch {
      // Probar siguiente URL
    }
  }
  return null;
}

// Compara dos textos en tiempo constante (no revela por timing cuántos caracteres coinciden).
function safeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  // Solo el cron (o quien tenga CRON_SECRET) puede ejecutarla: la clave pública de la app
  // no alcanza. Sin el secreto configurado la función queda cerrada para todos.
  const cronSecret = Deno.env.get('CRON_SECRET');
  const sentSecret = req.headers.get('x-cron-secret') ?? '';
  if (!cronSecret || !safeEqual(sentSecret, cronSecret)) {
    return new Response(JSON.stringify({ error: 'No autorizado.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const todayIso = new Date().toISOString().slice(0, 10);
    const challengeDate: string =
      typeof body?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
        ? body.date
        : todayIso;
    const force = Boolean(body?.force);

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash';

    if (!geminiApiKey || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          error: 'Faltan secretos GEMINI_API_KEY, SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // No pisar un desafío ya cargado (y especialmente si fue programado manualmente con is_custom)
    const { data: existing } = await supabase
      .from('daily_challenges')
      .select('id, is_custom')
      .eq('challenge_date', challengeDate)
      .maybeSingle();

    if (existing && (existing.is_custom || !force)) {
      return new Response(
        JSON.stringify({
          skipped: true,
          reason: existing.is_custom
            ? 'Desafío personalizado programado para esta fecha.'
            : 'Ya existe un desafío para esta fecha.',
          challengeDate,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const readingsText = await fetchReadingsText(challengeDate);

    const promptText = [
      `Genera el Desafío del Día de Trivia Católica para la fecha ${challengeDate} en español rioplatense/neutro claro, cálido y respetuoso.`,
      readingsText
        ? `Usa exclusivamente las lecturas litúrgicas reales de hoy (Primera Lectura + Evangelio del día) extraídas de Vatican News:\n\n${readingsText}`
        : `Basándote en el Leccionario Romano de la Iglesia Católica para la fecha ${challengeDate}, identifica la Primera Lectura y el Evangelio del día.`,
      '',
      'Requisitos estrictos:',
      '- Exactamente 5 preguntas: 2 sobre la Primera Lectura y 3 sobre el Evangelio del día.',
      '- Cada pregunta tiene 4 opciones plausibles sin ambigüedad y `correct_index` entre 0 y 3.',
      '- `explanation`: máximo 2 frases claras y fieles al Magisterio.',
      '- `source_ref`: cita bíblica exacta del pasaje + numeral del Catecismo relacionado separados por " · " (ej: "Lc 21,1-4 · CIC 2447").',
      '- `first_reading_ref` y `gospel_ref`: citas cortas (ej: "Ap 14,1-5" y "Lc 21,1-4").',
      '- `title`: título breve y atractivo (máx. 48 caracteres).',
      '- `subtitle`: 1 frase resumiendo las lecturas del día.',
      '- `topic_slug`: "antiguo-testamento" si la lectura es del AT, "nuevo-testamento" si es del NT, o "virgen-maria" en fiestas marianas.',
    ].join('\n');

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: DAILY_SCHEMA,
            temperature: 0.3,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(JSON.stringify({ error: 'Error de Gemini API', details: errText }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const geminiJson = await geminiRes.json();
    const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const parsed: GeneratedDailyPayload = JSON.parse(rawText);

    const validQuestions = (parsed.questions ?? [])
      .filter(
        (q) =>
          typeof q.prompt === 'string' &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          Number.isInteger(q.correct_index) &&
          q.correct_index >= 0 &&
          q.correct_index <= 3
      )
      .slice(0, 5)
      .map((q, idx) => ({
        id: `dq-${challengeDate}-${idx + 1}`,
        topicSlug: q.topic_slug || 'nuevo-testamento',
        difficulty: Math.min(3, Math.max(1, q.difficulty || 1)),
        prompt: q.prompt.trim(),
        options: q.options.map((o) => String(o).trim()),
        correctIndex: q.correct_index,
        explanation: q.explanation.trim(),
        sourceRef: q.source_ref.trim(),
      }));

    if (validQuestions.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Gemini devolvió menos de 3 preguntas válidas.' }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error: upsertError } = await supabase.from('daily_challenges').upsert(
      {
        challenge_date: challengeDate,
        liturgical_day: parsed.liturgical_day || 'Lecturas del día',
        title: parsed.title || 'Desafío de las lecturas de hoy',
        subtitle: parsed.subtitle || '',
        first_reading_ref: parsed.first_reading_ref || '',
        gospel_ref: parsed.gospel_ref || '',
        source_label: 'Lectura + Evangelio del día',
        is_custom: false,
        is_active: true,
        questions: validQuestions,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'challenge_date' }
    );

    if (upsertError) {
      return new Response(JSON.stringify({ error: upsertError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        challengeDate,
        title: parsed.title,
        firstReadingRef: parsed.first_reading_ref,
        gospelRef: parsed.gospel_ref,
        questionsCount: validQuestions.length,
        fetchedFromWeb: Boolean(readingsText),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error inesperado' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
