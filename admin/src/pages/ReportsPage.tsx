import { CheckCircle2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

interface ReportRow {
  id: string;
  question_id: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
  questions?: { prompt: string; source_ref: string | null } | null;
}

export function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [loading, setLoading] = useState(true);

  const loadRows = async () => {
    if (!supabase) return;
    setLoading(true);
    let query = supabase
      .from('question_reports')
      .select('id, question_id, reason, status, created_at, questions(prompt, source_ref)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    const { data } = await query;
    setRows((data ?? []) as unknown as ReportRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void loadRows();
  }, [filter]);

  const updateStatus = async (id: string, status: 'resolved' | 'dismissed') => {
    if (!supabase) return;
    await supabase
      .from('question_reports')
      .update({ status, resolved_at: new Date().toISOString() })
      .eq('id', id);
    await loadRows();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes doctrinales</h1>
          <p className="page-sub">
            Observaciones enviadas por los jugadores desde el popup de explicación.
          </p>
        </div>
      </div>

      <div className="toolbar">
        {(['open', 'resolved', 'all'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`btn btn-sm ${filter === tab ? 'btn-primary' : ''}`}
            onClick={() => setFilter(tab)}
          >
            {tab === 'open' ? 'Abiertos' : tab === 'resolved' ? 'Resueltos' : 'Todos'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card">Cargando reportes…</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Pregunta</th>
                <th>Motivo reportado</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>
                    {new Date(r.created_at).toLocaleDateString('es-PY')}
                  </td>
                  <td style={{ maxWidth: 340 }}>
                    <strong>{r.questions?.prompt ?? r.question_id}</strong>
                    {r.questions?.source_ref ? (
                      <div style={{ fontSize: 12, color: 'var(--ink2)' }}>
                        {r.questions.source_ref}
                      </div>
                    ) : null}
                  </td>
                  <td>{r.reason}</td>
                  <td>
                    <span
                      className={`chip ${
                        r.status === 'open' ? 'red' : r.status === 'resolved' ? 'green' : ''
                      }`}
                    >
                      {r.status === 'open'
                        ? 'Abierto'
                        : r.status === 'resolved'
                          ? 'Resuelto'
                          : 'Descartado'}
                    </span>
                  </td>
                  <td>
                    {r.status === 'open' ? (
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-sm btn-soft"
                          onClick={() => void updateStatus(r.id, 'resolved')}
                        >
                          <CheckCircle2 size={14} /> Resolver
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => void updateStatus(r.id, 'dismissed')}
                        >
                          <XCircle size={14} /> Descartar
                        </button>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--ink2)' }}>
                    No hay reportes en esta vista.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
