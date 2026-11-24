// ============================================================================
// Supabase Edge Function: notify-versus
// Envía notificaciones push reales (Android e iOS vía Expo Push Service)
// para eventos del Modo Versus:
//   - event: "challenged" -> avisa al rival que @retador lo desafió
//   - event: "completed"  -> avisa al retador si ganó, perdió o empató
//
// Seguridad:
//   - Requiere JWT válido de un participante real del duelo en public.versus_matches.
//   - challenged: solo el retador; completed: solo el rival. Ambos solo dentro de los
//     10 minutos posteriores al evento, para que no se pueda usar para spamear.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface NotifyVersusPayload {
  matchId: string;
  event: 'challenged' | 'completed';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Falta autorización.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData } = await userClient.auth.getUser();
    const callerId = authData.user?.id;
    if (!callerId) {
      return new Response(JSON.stringify({ error: 'Sesión inválida.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = (await req.json()) as NotifyVersusPayload;
    if (!payload.matchId || (payload.event !== 'challenged' && payload.event !== 'completed')) {
      return new Response(JSON.stringify({ error: 'Parámetros inválidos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: match, error: matchErr } = await adminClient
      .from('versus_matches')
      .select('*')
      .eq('id', payload.matchId)
      .maybeSingle();

    if (matchErr || !match) {
      return new Response(JSON.stringify({ error: 'Duelo no encontrado.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ventana anti-spam: el aviso solo se puede disparar justo después del evento.
    const NOTIFY_WINDOW_MS = 10 * 60 * 1000;
    const recent = (iso: string | null | undefined) =>
      !!iso && Date.now() - new Date(iso).getTime() < NOTIFY_WINDOW_MS;
    const skipped = () =>
      new Response(JSON.stringify({ ok: true, sentCount: 0, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    // Resolver destinatario y textos según el evento
    let recipientUserId: string | null = null;
    let title = '';
    let body = '';
    let deepLink = '/versus';

    if (payload.event === 'challenged') {
      if (match.challenger_id !== callerId) {
        return new Response(JSON.stringify({ error: 'Solo el retador puede disparar este aviso.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (match.status !== 'waiting_opponent' || !recent(match.created_at)) return skipped();

      recipientUserId = match.opponent_id ?? null;
      if (!recipientUserId && match.opponent_username) {
        const { data: oppProfile } = await adminClient
          .from('profiles')
          .select('id')
          .ilike('username', match.opponent_username)
          .eq('is_anonymous', false)
          .maybeSingle();
        recipientUserId = oppProfile?.id ?? null;
      }

      title = '¡Te desafiaron en Modo Versus!';
      body = `@${match.challenger_username} ya jugó su turno. Respondé las mismas ${match.total_questions} preguntas para definir el duelo.`;
      deepLink = `/play/versus-match-${match.id}`;
    } else {
      // event === 'completed': avisa al retador del resultado final.
      // Solo el rival que acaba de jugar su turno puede dispararlo.
      if (match.opponent_id !== callerId) {
        return new Response(JSON.stringify({ error: 'Solo el rival puede disparar este aviso.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (match.status !== 'completed' || !recent(match.completed_at)) return skipped();

      recipientUserId = match.challenger_id;
      const cScore = Number(match.challenger_score ?? 0);
      const oScore = Number(match.opponent_score ?? 0);

      if (match.winner === 'tie') {
        title = '¡Empate en el duelo Versus!';
        body = `@${match.opponent_username} empató con vos (${cScore} – ${oScore}). ¡Jugá la revancha!`;
      } else if (match.winner === 'opponent') {
        title = `@${match.opponent_username} te ganó el Versus`;
        body = `Marcador final: ${cScore} – ${oScore}. Entrá al Modo Versus para pedir revancha.`;
      } else {
        title = '¡Ganaste el duelo Versus!';
        body = `Superaste a @${match.opponent_username} por ${cScore} – ${oScore}.`;
      }
      deepLink = '/versus';
    }

    if (!recipientUserId || recipientUserId === callerId) {
      return new Response(JSON.stringify({ ok: true, sentCount: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: tokenRows } = await adminClient
      .from('user_push_tokens')
      .select('expo_push_token')
      .eq('user_id', recipientUserId)
      .eq('is_active', true);

    const tokens = Array.from(
      new Set(
        (tokenRows ?? [])
          .map((r) => r.expo_push_token)
          .filter((t): t is string => typeof t === 'string' && t.startsWith('ExponentPushToken['))
      )
    );

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ ok: true, sentCount: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messages = tokens.map((to) => ({
      to,
      sound: 'default',
      channelId: 'default',
      priority: 'high',
      title,
      body,
      data: { url: deepLink, matchId: match.id, event: payload.event },
    }));

    const pushRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    // Cada mensaje devuelve un ticket; DeviceNotRegistered = app desinstalada.
    let sentCount = 0;
    const deadTokens: string[] = [];
    if (pushRes.ok) {
      const result = await pushRes.json().catch(() => null);
      const tickets: Array<{ status: string; details?: { error?: string } }> =
        Array.isArray(result?.data) ? result.data : [];
      tickets.forEach((t, i) => {
        if (t.status === 'ok') sentCount += 1;
        else if (t.details?.error === 'DeviceNotRegistered') deadTokens.push(tokens[i]);
      });
    }
    if (deadTokens.length > 0) {
      await adminClient
        .from('user_push_tokens')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in('expo_push_token', deadTokens);
    }

    return new Response(
      JSON.stringify({ ok: pushRes.ok, sentCount, deactivated: deadTokens.length }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Error interno.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
