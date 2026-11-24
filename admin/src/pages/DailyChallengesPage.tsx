import { Calendar, Edit3, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

interface DailyQuestion {
  id: string;
  prompt: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  sourceRef: string;
}

interface DailyChallengeRow {
  id: string;
  challenge_date: string;
  liturgical_day: string;
  title: string;
  subtitle: string | null;
  first_reading_ref: string;
  gospel_ref: string;
  first_reading_text: string | null;
  gospel_text: string | null;
  source_label: string;
  is_custom: boolean;
  is_active: boolean;
  questions: DailyQuestion[];
}

function emptyQuestions(): DailyQuestion[] {
  return Array.from({ length: 5 }, (_, idx) => ({
    id: `dq-custom-${Date.now()}-${idx + 1}`,
    prompt: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    explanation: '',
    sourceRef: '',
  }));
}

export function DailyChallengesPage() {
  const [rows, setRows] = useState<DailyChallengeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editing, setEditing] = useState<DailyChallengeRow | null>(null);
  const [saving, setSaving] = useState(false);

  const loadRows = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('daily_challenges')
      .select('*')
      .order('challenge_date', { ascending: false })
      .limit(60);
    if (error) {
      setNotice({ type: 'error', text: error.message });
    } else {
      setRows((data ?? []) as DailyChallengeRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadRows();
  }, []);

  const openNew = () => {
    const today = new Date().toISOString().slice(0, 10);
    setEditing({
      id: '',
      challenge_date: today,
      liturgical_day: '',
      title: '',
      subtitle: '',
      first_reading_ref: '',
      gospel_ref: '',
      first_reading_text: '',
      gospel_text: '',
      source_label: 'Lectura + Evangelio del día',
      is_custom: true,
      is_active: true,
      questions: emptyQuestions(),
    });
  };

  const handleSave = async () => {
    if (!supabase || !editing) return;
    if (!editing.challenge_date || !editing.title.trim()) {
      setNotice({ type: 'error', text: 'Completá al menos la fecha y el título.' });
      return;
    }

    const cleanedQuestions = editing.questions
      .filter((q) => q.prompt.trim().length > 0)
      .map((q, idx) => ({
        ...q,
        id: q.id || `dq-${editing.challenge_date}-${idx + 1}`,
        topicSlug: 'nuevo-testamento',
        difficulty: 1,
      }));

    if (cleanedQuestions.length === 0) {
      setNotice({ type: 'error', text: 'Agregá al menos una pregunta para el desafío.' });
      return;
    }

    setSaving(true);
    const payload = {
      challenge_date: editing.challenge_date,
      liturgical_day: editing.liturgical_day.trim() || 'Desafío del día',
      title: editing.title.trim(),
      subtitle: editing.subtitle?.trim() || null,
      first_reading_ref: editing.first_reading_ref.trim(),
      gospel_ref: editing.gospel_ref.trim(),
      first_reading_text: editing.first_reading_text?.trim() || null,
      gospel_text: editing.gospel_text?.trim() || null,
      source_label: editing.source_label.trim() || 'Lectura + Evangelio del día',
      is_custom: editing.is_custom,
      is_active: editing.is_active,
      questions: cleanedQuestions,
      updated_at: new Date().toISOString(),
    };

    const { error } = editing.id
      ? await supabase.from('daily_challenges').update(payload).eq('id', editing.id)
      : await supabase.from('daily_challenges').upsert(payload, { onConflict: 'challenge_date' });

    setSaving(false);
    if (error) {
      setNotice({ type: 'error', text: error.message });
      return;
    }
    setNotice({
      type: 'success',
      text: `Desafío del ${editing.challenge_date} guardado correctamente.`,
    });
    setEditing(null);
    await loadRows();
  };

  const handleDelete = async (row: DailyChallengeRow) => {
    if (!supabase) return;
    if (!window.confirm(`¿Eliminar el desafío del ${row.challenge_date}?`)) return;
    const { error } = await supabase.from('daily_challenges').delete().eq('id', row.id);
    if (error) {
      setNotice({ type: 'error', text: error.message });
    } else {
      setNotice({ type: 'success', text: 'Desafío eliminado.' });
      await loadRows();
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Desafío del Día</h1>
          <p className="page-sub">
            Programá fechas especiales (solemnidades, campañas) o editá las lecturas y preguntas
            generadas automáticamente.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Plus size={18} /> Programar fecha
        </button>
      </div>

      {notice ? <div className={`alert ${notice.type}`}>{notice.text}</div> : null}

      {loading ? (
        <div className="card">Cargando calendario de desafíos…</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Título y tiempo litúrgico</th>
                <th>Lecturas</th>
                <th>Origen</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="chip blue">
                      <Calendar size={13} /> {row.challenge_date}
                    </span>
                  </td>
                  <td>
                    <strong>{row.title}</strong>
                    <div style={{ fontSize: 13, color: 'var(--ink2)' }}>{row.liturgical_day}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      <strong>1.ª:</strong> {row.first_reading_ref || '—'}
                    </div>
                    <div style={{ fontSize: 13 }}>
                      <strong>Ev.:</strong> {row.gospel_ref || '—'}
                    </div>
                  </td>
                  <td>
                    <span className={`chip ${row.is_custom ? 'gold' : ''}`}>
                      {row.is_custom ? 'Programado' : 'Automático'}
                    </span>
                  </td>
                  <td>
                    <span className={`chip ${row.is_active ? 'green' : 'red'}`}>
                      {row.is_active ? 'Activo' : 'Oculto'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() =>
                          setEditing({
                            ...row,
                            questions: Array.isArray(row.questions)
                              ? row.questions
                              : emptyQuestions(),
                          })
                        }
                      >
                        <Edit3 size={14} /> Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => void handleDelete(row)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: 'var(--ink2)' }}>
                    Todavía no hay desafíos cargados en Supabase.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <div className="modal-head">
              <h2>{editing.id ? 'Editar Desafío del Día' : 'Programar Desafío del Día'}</h2>
              <button type="button" className="btn btn-sm" onClick={() => setEditing(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="label">Fecha (YYYY-MM-DD)</label>
                <input
                  type="date"
                  className="input"
                  value={editing.challenge_date}
                  onChange={(e) => setEditing({ ...editing, challenge_date: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="label">Tiempo litúrgico / Jornada</label>
                <input
                  className="input"
                  placeholder="Ej. Domingo · Solemnidad de Cristo Rey"
                  value={editing.liturgical_day}
                  onChange={(e) => setEditing({ ...editing, liturgical_day: e.target.value })}
                />
              </div>

              <div className="field full">
                <label className="label">Título de la tarjeta en Inicio</label>
                <input
                  className="input"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>

              <div className="field full">
                <label className="label">Subtítulo breve</label>
                <input
                  className="input"
                  value={editing.subtitle ?? ''}
                  onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="label">Cita Primera Lectura</label>
                <input
                  className="input"
                  placeholder="Ej. Dn 7,13-14"
                  value={editing.first_reading_ref}
                  onChange={(e) => setEditing({ ...editing, first_reading_ref: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="label">Cita Evangelio del día</label>
                <input
                  className="input"
                  placeholder="Ej. Jn 18,33b-37"
                  value={editing.gospel_ref}
                  onChange={(e) => setEditing({ ...editing, gospel_ref: e.target.value })}
                />
              </div>

              <div className="field full">
                <label className="label">Texto de Primera Lectura (opcional — se muestra antes de jugar)</label>
                <textarea
                  className="textarea"
                  placeholder="Pegá el pasaje completo para que el jugador lo lea antes de empezar..."
                  value={editing.first_reading_text ?? ''}
                  onChange={(e) =>
                    setEditing({ ...editing, first_reading_text: e.target.value })
                  }
                />
              </div>

              <div className="field full">
                <label className="label">Texto del Evangelio (opcional — se muestra antes de jugar)</label>
                <textarea
                  className="textarea"
                  placeholder="Pegá el Evangelio del día para que el jugador lo lea antes de empezar..."
                  value={editing.gospel_text ?? ''}
                  onChange={(e) => setEditing({ ...editing, gospel_text: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="label">
                  <input
                    type="checkbox"
                    checked={editing.is_custom}
                    onChange={(e) => setEditing({ ...editing, is_custom: e.target.checked })}
                  />{' '}
                  Bloquear sobreescritura automática (is_custom)
                </label>
              </div>

              <div className="field">
                <label className="label">
                  <input
                    type="checkbox"
                    checked={editing.is_active}
                    onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  />{' '}
                  Visible en la app
                </label>
              </div>
            </div>

            <h3 style={{ marginTop: 22, marginBottom: 10 }}>
              Preguntas ({editing.questions.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {editing.questions.map((q, qIdx) => (
                <div key={q.id || qIdx} className="card" style={{ padding: 14 }}>
                  <div className="form-grid">
                    <div className="field full">
                      <label className="label">Pregunta #{qIdx + 1}</label>
                      <input
                        className="input"
                        value={q.prompt}
                        onChange={(e) => {
                          const next = [...editing.questions];
                          next[qIdx] = { ...q, prompt: e.target.value };
                          setEditing({ ...editing, questions: next });
                        }}
                      />
                    </div>
                    {[0, 1, 2, 3].map((optIdx) => (
                      <div key={optIdx} className="field">
                        <label className="label">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={q.correctIndex === optIdx}
                            onChange={() => {
                              const next = [...editing.questions];
                              next[qIdx] = { ...q, correctIndex: optIdx };
                              setEditing({ ...editing, questions: next });
                            }}
                          />{' '}
                          Opción {String.fromCharCode(65 + optIdx)}{' '}
                          {q.correctIndex === optIdx ? '(Correcta)' : ''}
                        </label>
                        <input
                          className="input"
                          value={q.options[optIdx] ?? ''}
                          onChange={(e) => {
                            const next = [...editing.questions];
                            const opts = [...q.options] as [string, string, string, string];
                            opts[optIdx] = e.target.value;
                            next[qIdx] = { ...q, options: opts };
                            setEditing({ ...editing, questions: next });
                          }}
                        />
                      </div>
                    ))}
                    <div className="field full">
                      <label className="label">Explicación doctrinal</label>
                      <input
                        className="input"
                        value={q.explanation}
                        onChange={(e) => {
                          const next = [...editing.questions];
                          next[qIdx] = { ...q, explanation: e.target.value };
                          setEditing({ ...editing, questions: next });
                        }}
                      />
                    </div>
                    <div className="field full">
                      <label className="label">Fuente (Biblia · CIC)</label>
                      <input
                        className="input"
                        placeholder="Ej. Lc 21,1-4 · CIC 2447"
                        value={q.sourceRef}
                        onChange={(e) => {
                          const next = [...editing.questions];
                          next[qIdx] = { ...q, sourceRef: e.target.value };
                          setEditing({ ...editing, questions: next });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="toolbar" style={{ marginTop: 18, justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={() => void handleSave()}
              >
                {saving ? 'Guardando…' : 'Guardar desafío'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
