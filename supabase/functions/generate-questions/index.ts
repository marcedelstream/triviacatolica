// Supabase Edge Function: generate-questions
// Genera lotes de preguntas católicas con Gemini Structured Outputs y las inserta en public.questions.
// Despliegue: supabase functions deploy generate-questions
// Secretos requeridos: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface GeneratedQuestion {
  prompt: string;
  options: [string, string, string, string];
  correct_index: number;
  explanation: string;
  source_ref: string;
}

const RESPONSE_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      prompt: { type: 'STRING' },
      options: {
        type: 'ARRAY',
        items: { type: 'STRING' },
      },
      correct_index: { type: 'INTEGER' },
      explanation: { type: 'STRING' },
      source_ref: { type: 'STRING' },
    },
    required: ['prompt', 'options', 'correct_index', 'explanation', 'source_ref'],
  },
};

Deno.serve(async (req: Request) => {
  try {
    const { topicSlug = 'nuevo-testamento', difficulty = 1, count = 10 } = await req.json().catch(() => ({}));

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.8-flash';

    if (!geminiApiKey || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Faltan variables de entorno (GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: topic, error: topicError } = await supabase
      .from('topics')
      .select('id, slug, title, description')
      .eq('slug', topicSlug)
      .single();

    if (topicError || !topic) {
      return new Response(
        JSON.stringify({ error: `Tópico no encontrado: ${topicSlug}` }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Traer los últimos 20 enunciados para evitar duplicados
    const { data: existing } = await supabase
      .from('questions')
      .select('prompt')
      .eq('topic_id', topic.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const existingPrompts = (existing ?? []).map((q) => `- ${q.prompt}`).join('\n');

    const promptText = [
      `Genera exactamente ${count} preguntas de trivia católica en español rioplatense/neutro claro y respetuoso.`,
      `Tópico: ${topic.title} (${topic.description ?? ''}).`,
      `Nivel de dificultad: ${difficulty} (1 = básico, 2 = intermedio, 3 = avanzado).`,
      'Reglas estrictas:',
      '- Fidelidad absoluta al Catecismo de la Iglesia Católica (CIC) y a la Biblia católica (incluyendo libros deuterocanónicos cuando corresponda).',
      '- Exactamente 4 opciones plausibles sin ambigüedades; correct_index entre 0 y 3.',
      '- Explicación clara de máximo 2 frases y cita exacta en source_ref (ej.: "CIC 1324" o "Jn 6,51").',
      '- Lenguaje cálido y legible para jóvenes y adultos mayores.',
      existingPrompts ? `No repitas ni parafrasees estas preguntas ya existentes:\n${existingPrompts}` : '',
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
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0.4,
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
    const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
    const parsed: GeneratedQuestion[] = JSON.parse(rawText);

    const rows = parsed
      .filter(
        (q) =>
          typeof q.prompt === 'string' &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          Number.isInteger(q.correct_index) &&
          q.correct_index >= 0 &&
          q.correct_index <= 3 &&
          typeof q.explanation === 'string'
      )
      .map((q) => ({
        topic_id: topic.id,
        difficulty,
        prompt: q.prompt.trim(),
        options: q.options.map((o) => o.trim()),
        correct_index: q.correct_index,
        explanation: q.explanation.trim(),
        source_ref: q.source_ref?.trim() ?? null,
        is_active: true,
      }));

    if (rows.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, warning: 'Sin preguntas válidas generadas.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: insertError } = await supabase.from('questions').insert(rows);
    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ topic: topic.slug, difficulty, inserted: rows.length }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Error inesperado' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
