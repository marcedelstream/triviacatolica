import { Edit3, ExternalLink, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

interface BannerRow {
  id: string;
  tipo: 'oracion' | 'iniciativa' | 'novedad';
  titulo: string;
  texto: string;
  imagen: string | null;
  link: string | null;
  orden: number;
  is_active: boolean;
}

interface NewsRow {
  id: string;
  source_name: string;
  section_label: string;
  title: string;
  external_url: string;
  published_at: string;
  is_active: boolean;
}

export function BannersNewsPage() {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [editingBanner, setEditingBanner] = useState<BannerRow | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    if (!supabase) return;
    const [bRes, nRes] = await Promise.all([
      supabase.from('banners').select('*').order('orden'),
      supabase
        .from('news_quizzes')
        .select('id, source_name, section_label, title, external_url, published_at, is_active')
        .order('published_at', { ascending: false })
        .limit(20),
    ]);
    setBanners((bRes.data ?? []) as BannerRow[]);
    setNews((nRes.data ?? []) as NewsRow[]);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const saveBanner = async () => {
    if (!supabase || !editingBanner) return;
    if (!editingBanner.titulo.trim() || !editingBanner.texto.trim()) {
      setNotice({ type: 'error', text: 'Completá título y texto del banner.' });
      return;
    }
    setSaving(true);
    const payload = {
      tipo: editingBanner.tipo,
      titulo: editingBanner.titulo.trim(),
      texto: editingBanner.texto.trim(),
      imagen: editingBanner.imagen?.trim() || null,
      link: editingBanner.link?.trim() || null,
      orden: editingBanner.orden,
      is_active: editingBanner.is_active,
    };
    const { error } = editingBanner.id
      ? await supabase.from('banners').update(payload).eq('id', editingBanner.id)
      : await supabase.from('banners').insert(payload);
    setSaving(false);
    if (error) {
      setNotice({ type: 'error', text: error.message });
      return;
    }
    setNotice({ type: 'success', text: 'Banner guardado.' });
    setEditingBanner(null);
    await loadAll();
  };

  const toggleNews = async (item: NewsRow) => {
    if (!supabase) return;
    await supabase.from('news_quizzes').update({ is_active: !item.is_active }).eq('id', item.id);
    await loadAll();
  };

  const deleteBanner = async (b: BannerRow) => {
    if (!supabase || !window.confirm(`¿Eliminar el banner "${b.titulo}"?`)) return;
    await supabase.from('banners').delete().eq('id', b.id);
    await loadAll();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Banners y Noticias</h1>
          <p className="page-sub">
            Administrá los avisos del carrusel de Inicio y las noticias con mini-quiz.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() =>
            setEditingBanner({
              id: '',
              tipo: 'novedad',
              titulo: '',
              texto: '',
              imagen: '',
              link: '',
              orden: banners.length + 1,
              is_active: true,
            })
          }
        >
          <Plus size={18} /> Nuevo banner
        </button>
      </div>

      {notice ? <div className={`alert ${notice.type}`}>{notice.text}</div> : null}

      <div className="card">
        <h2 className="card-title">Banners del carrusel ({banners.length})</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Título y texto</th>
                <th>Orden</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b.id}>
                  <td>
                    <span className="chip blue">{b.tipo}</span>
                  </td>
                  <td>
                    <strong>{b.titulo}</strong>
                    <div style={{ fontSize: 13, color: 'var(--ink2)' }}>{b.texto}</div>
                  </td>
                  <td>{b.orden}</td>
                  <td>
                    <span className={`chip ${b.is_active ? 'green' : 'red'}`}>
                      {b.is_active ? 'Activo' : 'Oculto'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => setEditingBanner(b)}
                      >
                        <Edit3 size={14} /> Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => void deleteBanner(b)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Últimas noticias con mini-quiz ({news.length})</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Medio</th>
                <th>Titular</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {news.map((n) => (
                <tr key={n.id}>
                  <td>
                    <span className="chip gold">{n.source_name}</span>
                  </td>
                  <td>
                    <strong>{n.title}</strong>
                    <div style={{ fontSize: 12, color: 'var(--ink2)' }}>
                      {n.section_label} · {new Date(n.published_at).toLocaleDateString('es-PY')}
                    </div>
                  </td>
                  <td>
                    <span className={`chip ${n.is_active ? 'green' : 'red'}`}>
                      {n.is_active ? 'Visible' : 'Oculta'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => void toggleNews(n)}
                      >
                        {n.is_active ? 'Ocultar' : 'Mostrar'}
                      </button>
                      <a
                        href={n.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        <ExternalLink size={14} /> Nota
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingBanner ? (
        <div className="modal-backdrop">
          <div className="modal-panel">
            <div className="modal-head">
              <h2>{editingBanner.id ? 'Editar banner' : 'Nuevo banner'}</h2>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setEditingBanner(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="form-grid">
              <div className="field">
                <label className="label">Tipo</label>
                <select
                  className="select"
                  value={editingBanner.tipo}
                  onChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      tipo: e.target.value as BannerRow['tipo'],
                    })
                  }
                >
                  <option value="novedad">Novedad</option>
                  <option value="oracion">Oración</option>
                  <option value="iniciativa">Iniciativa</option>
                </select>
              </div>
              <div className="field">
                <label className="label">Orden</label>
                <input
                  type="number"
                  className="input"
                  value={editingBanner.orden}
                  onChange={(e) =>
                    setEditingBanner({ ...editingBanner, orden: Number(e.target.value) })
                  }
                />
              </div>
              <div className="field full">
                <label className="label">Título</label>
                <input
                  className="input"
                  value={editingBanner.titulo}
                  onChange={(e) => setEditingBanner({ ...editingBanner, titulo: e.target.value })}
                />
              </div>
              <div className="field full">
                <label className="label">Texto</label>
                <textarea
                  className="textarea"
                  value={editingBanner.texto}
                  onChange={(e) => setEditingBanner({ ...editingBanner, texto: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="label">Enlace externo (opcional)</label>
                <input
                  className="input"
                  value={editingBanner.link ?? ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, link: e.target.value })}
                />
              </div>
              <div className="field">
                <label className="label">Imagen URL (opcional)</label>
                <input
                  className="input"
                  value={editingBanner.imagen ?? ''}
                  onChange={(e) => setEditingBanner({ ...editingBanner, imagen: e.target.value })}
                />
              </div>
              <div className="field full">
                <label className="label">
                  <input
                    type="checkbox"
                    checked={editingBanner.is_active}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, is_active: e.target.checked })
                    }
                  />{' '}
                  Visible en Inicio
                </label>
              </div>
            </div>
            <div className="toolbar" style={{ marginTop: 18, justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => setEditingBanner(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={() => void saveBanner()}
              >
                {saving ? 'Guardando…' : 'Guardar banner'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
