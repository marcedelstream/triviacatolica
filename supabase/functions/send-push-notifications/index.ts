// ============================================================================
// Supabase Edge Function: send-push-notifications
// Envía notificaciones push personalizadas desde app.triviacatolica.com
// usando Expo Push Service (https://exp.host/--/api/v2/push/send).
//
// Seguridad:
//   - Requiere JWT de un usuario autenticado que pase public.is_admin().
//
// Body JSON esperado:
//   {
//     "campaignId": "<uuid>" // opcional si ya se guardó en notification_campaigns
//     "title": "Nuevo Desafío del Día",
//     "body": "Leé el Evangelio de hoy y sumá tus puntos de la racha.",
//     "deepLink": "/play/desafio-del-dia",
//     "segmentType": "all" | "country" | "username" | "pro" | "free" | "inactive",
//     "segmentValue": "PY" | "marce" | null
//   }
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface SendPayload {
  campaignId?: string;
  title: string;
  body: string;
  deepLink?: string | null;
  segmentType: 'all' | 'country' | 'username' | 'pro' | 'free' | 'inactive';
  segmentValue?: string | null;
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

    // 1. Verificar que quien invoca es administrador en public.admin_users
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: isAdmin, error: adminErr } = await userClient.rpc('is_admin');
    if (adminErr || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Solo administradores pueden enviar notificaciones.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: userRes } = await userClient.auth.getUser();
    const adminUserId = userRes.user?.id ?? null;

    const payload = (await req.json()) as SendPayload;
    const title = payload.title?.trim();
    const body = payload.body?.trim();
    if (!title || !body) {
      return new Response(JSON.stringify({ error: 'Completá título y mensaje.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // 2. Resolver usuarios objetivo según el segmento
    let profilesQuery = adminClient.from('profiles').select('id');
    const segVal = payload.segmentValue?.trim() ?? '';

    if (payload.segmentType === 'country' && segVal) {
      profilesQuery = profilesQuery.eq('country', segVal.toUpperCase());
    } else if (payload.segmentType === 'username' && segVal) {
      profilesQuery = profilesQuery.ilike('username', segVal.replace(/^@/, ''));
    } else if (payload.segmentType === 'pro') {
      profilesQuery = profilesQuery.eq('is_premium', true);
    } else if (payload.segmentType === 'free') {
      profilesQuery = profilesQuery.eq('is_premium', false);
    } else if (payload.segmentType === 'inactive') {
      const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10);
      profilesQuery = profilesQuery.or(`last_played_date.is.null,last_played_date.lt.${threeDaysAgo}`);
    }

    const { data: targetProfiles } = await profilesQuery.limit(2000);
    const targetIds = (targetProfiles ?? []).map((p) => p.id);

    let tokens: string[] = [];
    if (targetIds.length > 0) {
      const { data: tokenRows } = await adminClient
        .from('user_push_tokens')
        .select('expo_push_token')
        .eq('is_active', true)
        .in('user_id', targetIds);
      tokens = Array.from(
        new Set(
          (tokenRows ?? [])
            .map((r) => r.expo_push_token)
            .filter((t): t is string => typeof t === 'string' && t.startsWith('ExponentPushToken['))
        )
      );
    }

    // 3. Enviar en lotes de 100 vía Expo Push API (límite por request).
    //    Cada mensaje devuelve un "ticket": ok, o error (ej. DeviceNotRegistered = app
    //    desinstalada); esos tokens se desactivan para no volver a usarlos.
    let sentCount = 0;
    const errors: string[] = [];
    const deadTokens: string[] = [];
    // Solo rutas internas de la app (la app ignora cualquier otra cosa).
    const deepLink = payload.deepLink?.trim().startsWith('/') ? payload.deepLink.trim() : null;

    for (let i = 0; i < tokens.length; i += 100) {
      const chunk = tokens.slice(i, i + 100);
      const messages = chunk.map((to) => ({
        to,
        sound: 'default',
        channelId: 'default', // canal que crea la app en Android (pushService.ts)
        title,
        body,
        data: deepLink ? { url: deepLink } : {},
      }));

      try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          signal: AbortSignal.timeout(20000),
          headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messages),
        });
        if (!res.ok) {
          errors.push(`Expo Push HTTP ${res.status}`);
          continue;
        }
        const result = await res.json();
        const tickets: Array<{ status: string; message?: string; details?: { error?: string } }> =
          Array.isArray(result?.data) ? result.data : [];
        tickets.forEach((ticket, idx) => {
          if (ticket.status === 'ok') {
            sentCount += 1;
          } else if (ticket.details?.error === 'DeviceNotRegistered') {
            deadTokens.push(chunk[idx]);
          } else {
            errors.push(ticket.details?.error ?? ticket.message ?? 'Error de Expo Push');
          }
        });
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Sin respuesta de Expo Push');
      }
    }

    if (deadTokens.length > 0) {
      await adminClient
        .from('user_push_tokens')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in('expo_push_token', deadTokens);
    }
    // Errores repetidos resumidos (ej. "InvalidCredentials x40").
    const errorSummary = Object.entries(
      errors.reduce<Record<string, number>>((acc, e) => ((acc[e] = (acc[e] ?? 0) + 1), acc), {})
    ).map(([e, n]) => (n > 1 ? `${e} x${n}` : e));
    errors.length = 0;
    errors.push(...errorSummary);

    const nowIso = new Date().toISOString();
    const status = errors.length > 0 && sentCount === 0 ? 'failed' : 'sent';

    // 4. Registrar o actualizar campaña en notification_campaigns
    if (payload.campaignId) {
      await adminClient
        .from('notification_campaigns')
        .update({
          status,
          sent_at: nowIso,
          sent_count: sentCount,
          error_message: errors.length > 0 ? errors.join('; ') : null,
        })
        .eq('id', payload.campaignId);
    } else {
      await adminClient.from('notification_campaigns').insert({
        title,
        body,
        deep_link: deepLink,
        segment_type: payload.segmentType,
        segment_value: segVal || null,
        status,
        sent_at: nowIso,
        sent_count: sentCount,
        error_message: errors.length > 0 ? errors.join('; ') : null,
        created_by: adminUserId,
      });
    }

    return new Response(
      JSON.stringify({
        ok: status === 'sent',
        sentCount,
        matchedUsers: targetIds.length,
        devices: tokens.length,
        deactivated: deadTokens.length,
        errors,
        message:
          sentCount > 0
            ? `Notificación enviada a ${sentCount} dispositivos.`
            : tokens.length === 0
              ? 'Campaña registrada. Todavía no hay dispositivos con token push en ese segmento.'
              : `No se pudo enviar a los ${tokens.length} dispositivos: ${errors.join('; ') || 'sin detalle'}.`,
      }),
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
