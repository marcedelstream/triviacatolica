import { Edit3, Plus, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

interface ReferenceRow {
  id: string;
  ref_key: string;
  source_type: 'biblia' | 'cic' | 'igmr' | 'otro';
  title: string;
  book_or_section: string | null;
  body: string;
}

export function ReferencesPage() {
  const [rows, setRows] = useState<ReferenceRow[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ReferenceRow | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadRows = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('reference_texts')
      .select('*')
      .order('ref_key')
      .limit(400);
    if (error) {
      setNotice({ type: 'error', text: error.message });
    } else {
      setRows((data ?? []) as ReferenceRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadRows();
  }, []);

  const filtered = rows.filter((r) => {
    if (filterType !== 'all' && r.source_type !== filterType) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (
        r.ref_key.toLowerCase().includes(s) ||
        r.title.toLowerCase().includes(s) ||
        r.body.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const handleSave = async () => {
    if (!supabase || !editing) return;
    if (!editing.ref_key.trim() || !editing.title.trim() || !editing.body.trim()) {
      setNotice({ type: 'error', text: 'Completá la clave de cita, título y texto completo.' });
      return;
    }
    setSaving(true);
    const payload = {
      ref_key: editing.ref_key.trim(),
      source_type: editing.source_type,
      title: editing.title.trim(),
      book_or_section: editing.book_or_section?.trim() || null,
      body: editing.body.trim(),
    };
    const { error } = editing.id
      ? await supabase.from('reference_texts').update(payload).eq('id', editing.id)
      : await supabase.from('reference_texts').upsert(payload, { onConflict: 'ref_key' });
    setSaving(false);
    if (error) {
      setNotice({ type: 'error', text: error.message });
      return;
    }
    setNotice({ type: 'success', text: `Cita "${payload.ref_key}" guardada.` });
    setEditing(null);
    await loadRows();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fuentes: Biblia, CIC e IGMR</h1>
          <p className="page-sub">
            Textos completos que se muestran al abrir «Ver explicación» y las lecturas diarias.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            setEditing({
              id: '',
              ref_key: '',
              source_type: 'biblia',
              title: '',
              book_or_section: '',
              body: '',
            })
          }
        >
          <Plus size={18} /> Nueva fuente
        </button>
      </div>

      {notice ? <div className={`alert ${notice.type}`}>{notice.text}</div> : null}

      <div className="toolbar">
        <select
          className="select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">Todas ({rows.length})</option>
          <option value="biblia">Biblia</option>
          <option value="cic">Catecismo (CIC)</option>
          <option value="igmr">Liturgia (IGMR)</option>
          <option value="otro">Otro</option>
        </select>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: 12, top: 14, color: 'var(--ink2)' }}
          />
          <input
            className="input"
            style={{ paddingLeft: 36, width: '100%' }}
            placeholder="Buscar cita (ej. Lc 21,1-4 o CIC 1219)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="card">Cargando banco de citas…</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cita</th>
                <th>Tipo</th>
                <th>Título y extracto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.ref_key}</strong>
                  </td>
                  <td>
                    <span
                      className={`chip ${
                        r.source_type === 'biblia'
                          ? 'blue'
                          : r.source_type === 'cic'
                            ? 'gold'
                            : ''
                      }`}
                    >
                      {r.source_type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ maxWidth: 520 }}>
                    <strong>{r.title}</strong>
                    <div style={{ fontSize: 13, color: 'var(--ink2)', marginTop: 2 }}>
                      {r.body.slice(0, 140)}
                      {r.body.length > 140 ? '…' : ''}
                    </div>
                  </td>
                  <td>
                    <button type="button" className="btn btn-sm" onClick={() => setEditing(r)}>
                      <Edit3 size={14} /> Editar
                    </button>
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
              <h2>{editing.id ? 'Editar cita' : 'Nueva cita'}</h2>
              <button type="button" className="btn btn-sm" onClick={() => setEditing(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="label">Clave exacta (ref_key)</label>
                <input
                  className="input"
                  placeholder="Ej. Jn 3,16 o CIC 1324"
                  value={editing.ref_key}
                  onChange={(e) => setEditing({ ...editing, ref_key: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="label">Tipo</label>
                <select
                  className="select"
                  value={editing.source_type}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      source_type: e.target.value as ReferenceRow['source_type'],
                    })
                  }
                >
                  <option value="biblia">Biblia</option>
                  <option value="cic">Catecismo (CIC)</option>
                  <option value="igmr">Liturgia (IGMR)</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div className="field">
                <label className="label">Título legible</label>
                <input
                  className="input"
                  placeholder="Ej. Juan 3, 16"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>

              <div className="field">
                <label className="label">Libro o sección</label>
                <input
                  className="input"
                  placeholder="Ej. Nuevo Testamento · Evangelio según san Juan"
                  value={editing.book_or_section ?? ''}
                  onChange={(e) => setEditing({ ...editing, book_or_section: e.target.value })}
                />
              </div>

              <div className="field full">
                <label className="label">Texto completo</label>
                <textarea
                  className="textarea"
                  style={{ minHeight: 140 }}
                  value={editing.body}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                />
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
                {saving ? 'Guardando…' : 'Guardar fuente'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
