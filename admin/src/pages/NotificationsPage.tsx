import { Bell, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

interface CampaignRow {
  id: string;
  title: string;
  body: string;
  deep_link: string | null;
  segment_type: 'all' | 'country' | 'username' | 'pro' | 'free' | 'inactive';
  segment_value: string | null;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  sent_at: string | null;
  sent_count: number;
  created_at: string;
}

export function NotificationsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [deepLink, setDeepLink] = useState('/play/desafio-del-dia');
  const [segmentType, setSegmentType] = useState<CampaignRow['segment_type']>('all');
  const [segmentValue, setSegmentValue] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(
    null
  );

  const loadCampaigns = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('notification_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    setCampaigns((data ?? []) as CampaignRow[]);
  };

  useEffect(() => {
    void loadCampaigns();
  }, []);

  const handleSendNow = async () => {
    if (!supabase) return;
    if (!title.trim() || !body.trim()) {
      setNotice({ type: 'error', text: 'Completá el título y el mensaje de la notificación.' });
      return;
    }
    setSending(true);
    setNotice(null);

    const { data, error } = await supabase.functions.invoke('send-push-notifications', {
      body: {
        title: title.trim(),
        body: body.trim(),
        deepLink: deepLink.trim() || null,
        segmentType,
        segmentValue: segmentValue.trim() || null,
      },
    });

    setSending(false);
    if (error) {
      setNotice({
        type: 'error',
        text: `No se pudo invocar send-push-notifications (${error.message}). Desplegá la Edge Function en Supabase y volvé a probar.`,
      });
      return;
    }

    setNotice({
      type: 'success',
      text: (data as { message?: string })?.message || 'Campaña enviada correctamente.',
    });
    setTitle('');
    setBody('');
    setSegmentValue('');
    await loadCampaigns();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notificaciones Push Personalizadas</h1>
          <p className="page-sub">
            Enviá avisos a toda la comunidad, a un país específico o a un @usuario puntual.
          </p>
        </div>
      </div>

      {notice ? <div className={`alert ${notice.type}`}>{notice.text}</div> : null}

      <div className="card">
        <h2 className="card-title">Nueva notificación</h2>
        <div className="form-grid">
          <div className="field full">
            <label className="label">Título</label>
            <input
              className="input"
              placeholder="Ej. ¡Ya está listo el Desafío del Día!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="field full">
            <label className="label">Mensaje</label>
            <textarea
              className="textarea"
              placeholder="Leé el Evangelio de hoy y mantené viva tu racha en Trivia Católica."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label">Segmento de usuarios</label>
            <select
              className="select"
              value={segmentType}
              onChange={(e) => setSegmentType(e.target.value as CampaignRow['segment_type'])}
            >
              <option value="all">Todos los usuarios</option>
              <option value="country">Por país (código ISO, ej. PY)</option>
              <option value="username">Un @usuario puntual</option>
              <option value="inactive">Inactivos (más de 3 días sin jugar)</option>
              <option value="free">Solo usuarios gratuitos</option>
              <option value="pro">Solo usuarios Pro</option>
            </select>
          </div>

          {segmentType === 'country' || segmentType === 'username' ? (
            <div className="field">
              <label className="label">
                {segmentType === 'country' ? 'Código de país (ISO-2)' : '@usuario destinatario'}
              </label>
              <input
                className="input"
                placeholder={segmentType === 'country' ? 'PY, AR, MX, ES…' : '@marce'}
                value={segmentValue}
                onChange={(e) => setSegmentValue(e.target.value)}
              />
            </div>
          ) : (
            <div className="field">
              <label className="label">Pantalla destino (deep link)</label>
              <input
                className="input"
                placeholder="/play/desafio-del-dia"
                value={deepLink}
                onChange={(e) => setDeepLink(e.target.value)}
              />
            </div>
          )}

          {segmentType === 'country' || segmentType === 'username' ? (
            <div className="field full">
              <label className="label">Pantalla destino (deep link)</label>
              <input
                className="input"
                placeholder="/play/desafio-del-dia"
                value={deepLink}
                onChange={(e) => setDeepLink(e.target.value)}
              />
            </div>
          ) : null}
        </div>

        <div className="toolbar" style={{ marginTop: 18, justifyContent: 'flex-end', marginBottom: 0 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={sending}
            onClick={() => void handleSendNow()}
          >
            <Send size={16} /> {sending ? 'Enviando…' : 'Enviar notificación ahora'}
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">
          <Bell size={18} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
          Historial de envíos ({campaigns.length})
        </h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Título y mensaje</th>
                <th>Segmento</th>
                <th>Enviados</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {new Date(c.sent_at || c.created_at).toLocaleString('es-PY')}
                  </td>
                  <td>
                    <strong>{c.title}</strong>
                    <div style={{ fontSize: 13, color: 'var(--ink2)' }}>{c.body}</div>
                  </td>
                  <td>
                    <span className="chip blue">
                      {c.segment_type}
                      {c.segment_value ? `: ${c.segment_value}` : ''}
                    </span>
                  </td>
                  <td>
                    <strong>{c.sent_count}</strong>
                  </td>
                  <td>
                    <span
                      className={`chip ${
                        c.status === 'sent' ? 'green' : c.status === 'failed' ? 'red' : 'gold'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--ink2)' }}>
                    Todavía no se enviaron campañas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
