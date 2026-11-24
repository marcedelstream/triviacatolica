import { Edit3, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

interface TopicRow {
  id: string;
  slug: string;
  title: string;
}

interface LevelRow {
  id: string;
  topic_id: string;
  level_number: number;
  title: string;
}

interface QuestionRow {
  id: string;
  topic_id: string;
  level_id: string | null;
  difficulty: number;
  prompt: string;
  options: [string, string, string, string];
  correct_index: number;
  explanation: string;
  source_ref: string | null;
  is_active: boolean;
}

export function QuestionsPage() {
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [levels, setLevels] = useState<LevelRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<QuestionRow | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    if (!supabase) return;
    setLoading(true);
    const [tRes, lRes, qRes] = await Promise.all([
      supabase.from('topics').select('id, slug, title').order('sort_order'),
      supabase.from('levels').select('id, topic_id, level_number, title').order('global_order'),
      supabase.from('questions').select('*').order('created_at', { ascending: false }).limit(250),
    ]);
    setTopics((tRes.data ?? []) as TopicRow[]);
    setLevels((lRes.data ?? []) as LevelRow[]);
    setQuestions((qRes.data ?? []) as QuestionRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const filtered = questions.filter((q) => {
    if (selectedTopic !== 'all' && q.topic_id !== selectedTopic) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (
        q.prompt.toLowerCase().includes(s) ||
        (q.source_ref ?? '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  const openNew = () => {
    const firstTopic = topics[0]?.id ?? '';
    const firstLevel = levels.find((l) => l.topic_id === firstTopic)?.id ?? null;
    setEditing({
      id: '',
      topic_id: firstTopic,
      level_id: firstLevel,
      difficulty: 1,
      prompt: '',
      options: ['', '', '', ''],
      correct_index: 0,
      explanation: '',
      source_ref: '',
      is_active: true,
    });
  };

  const handleSave = async () => {
    if (!supabase || !editing) return;
    if (!editing.prompt.trim() || editing.options.some((o) => !o.trim())) {
      setNotice({ type: 'error', text: 'Completá la pregunta y las 4 opciones.' });
      return;
    }
    setSaving(true);
    const payload = {
      topic_id: editing.topic_id,
      level_id: editing.level_id || null,
      difficulty: editing.difficulty,
      prompt: editing.prompt.trim(),
      options: editing.options.map((o) => o.trim()),
      correct_index: editing.correct_index,
      explanation: editing.explanation.trim(),
      source_ref: editing.source_ref?.trim() || null,
      is_active: editing.is_active,
    };
    const { error } = editing.id
      ? await supabase.from('questions').update(payload).eq('id', editing.id)
      : await supabase.from('questions').insert(payload);

    setSaving(false);
    if (error) {
      setNotice({ type: 'error', text: error.message });
      return;
    }
    setNotice({ type: 'success', text: 'Pregunta guardada.' });
    setEditing(null);
    await loadAll();
  };

  const toggleActive = async (q: QuestionRow) => {
    if (!supabase) return;
    await supabase.from('questions').update({ is_active: !q.is_active }).eq('id', q.id);
    await loadAll();
  };

  const topicMap = new Map(topics.map((t) => [t.id, t.title]));
  const levelMap = new Map(levels.map((l) => [l.id, `N${l.level_number} · ${l.title}`]));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Preguntas y Niveles</h1>
          <p className="page-sub">
            Administrá el banco de preguntas doctrinales vinculadas a cada categoría y nivel.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Plus size={18} /> Nueva pregunta
        </button>
      </div>

      {notice ? <div className={`alert ${notice.type}`}>{notice.text}</div> : null}

      <div className="toolbar">
        <select
          className="select"
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
        >
          <option value="all">Todas las categorías ({questions.length})</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>

        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: 12, top: 14, color: 'var(--ink2)' }}
          />
          <input
            className="input"
            style={{ paddingLeft: 36, width: '100%' }}
            placeholder="Buscar por texto o cita (ej. CIC 1219)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="card">Cargando preguntas…</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pregunta</th>
                <th>Categoría / Nivel</th>
                <th>Fuente</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id}>
                  <td style={{ maxWidth: 420 }}>
                    <strong>{q.prompt}</strong>
                    <div style={{ fontSize: 13, color: 'var(--ink2)', marginTop: 4 }}>
                      Correcta: {q.options[q.correct_index]}
                    </div>
                  </td>
                  <td>
                    <div className="chip blue">{topicMap.get(q.topic_id) ?? '—'}</div>
                    {q.level_id ? (
                      <div style={{ fontSize: 12, color: 'var(--ink2)', marginTop: 4 }}>
                        {levelMap.get(q.level_id) ?? ''}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ fontSize: 13 }}>{q.source_ref || '—'}</td>
                  <td>
                    <span className={`chip ${q.is_active ? 'green' : 'red'}`}>
                      {q.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setEditing(q)}
                      >
                        <Edit3 size={14} /> Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => void toggleActive(q)}
                      >
                        {q.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <div className="modal-head">
              <h2>{editing.id ? 'Editar pregunta' : 'Nueva pregunta'}</h2>
              <button type="button" className="btn btn-sm" onClick={() => setEditing(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="label">Categoría</label>
                <select
                  className="select"
                  value={editing.topic_id}
                  onChange={(e) => {
                    const tid = e.target.value;
                    const firstLvl = levels.find((l) => l.topic_id === tid)?.id ?? null;
                    setEditing({ ...editing, topic_id: tid, level_id: firstLvl });
                  }}
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="label">Nivel asignado</label>
                <select
                  className="select"
                  value={editing.level_id ?? ''}
                  onChange={(e) =>
                    setEditing({ ...editing, level_id: e.target.value || null })
                  }
                >
                  <option value="">Sin nivel fijo (pool general)</option>
                  {levels
                    .filter((l) => l.topic_id === editing.topic_id)
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        Nivel {l.level_number} · {l.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="field full">
                <label className="label">Enunciado de la pregunta</label>
                <textarea
                  className="textarea"
                  value={editing.prompt}
                  onChange={(e) => setEditing({ ...editing, prompt: e.target.value })}
                />
              </div>

              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className="field">
                  <label className="label">
                    <input
                      type="radio"
                      name="q-correct"
                      checked={editing.correct_index === idx}
                      onChange={() => setEditing({ ...editing, correct_index: idx })}
                    />{' '}
                    Opción {String.fromCharCode(65 + idx)}{' '}
                    {editing.correct_index === idx ? '(Correcta)' : ''}
                  </label>
                  <input
                    className="input"
                    value={editing.options[idx] ?? ''}
                    onChange={(e) => {
                      const opts = [...editing.options] as [string, string, string, string];
                      opts[idx] = e.target.value;
                      setEditing({ ...editing, options: opts });
                    }}
                  />
                </div>
              ))}

              <div className="field full">
                <label className="label">Explicación doctrinal</label>
                <textarea
                  className="textarea"
                  value={editing.explanation}
                  onChange={(e) => setEditing({ ...editing, explanation: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="label">Cita / Fuente (Biblia · CIC · IGMR)</label>
                <input
                  className="input"
                  placeholder="Ej. Mt 16,18 · CIC 552"
                  value={editing.source_ref ?? ''}
                  onChange={(e) => setEditing({ ...editing, source_ref: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="label">Dificultad</label>
                <select
                  className="select"
                  value={editing.difficulty}
                  onChange={(e) =>
                    setEditing({ ...editing, difficulty: Number(e.target.value) })
                  }
                >
                  <option value={1}>1 · Básica</option>
                  <option value={2}>2 · Intermedia</option>
                  <option value={3}>3 · Avanzada</option>
                </select>
              </div>
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
                {saving ? 'Guardando…' : 'Guardar pregunta'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
