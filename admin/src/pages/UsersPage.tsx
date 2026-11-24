import { Crown, Search, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

interface ProfileRow {
  id: string;
  display_name: string | null;
  username: string | null;
  country: string | null;
  xp: number;
  streak_count: number;
  is_anonymous: boolean;
  is_premium: boolean;
  is_verified_priest: boolean;
  last_played_date: string | null;
  created_at: string;
}

export function UsersPage() {
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [search, setSearch] = useState('');
  const [onlyRegistered, setOnlyRegistered] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    if (!supabase) return;
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select(
        'id, display_name, username, country, xp, streak_count, is_anonymous, is_premium, is_verified_priest, last_played_date, created_at'
      )
      .order('xp', { ascending: false })
      .limit(200);
    if (onlyRegistered) {
      query = query.eq('is_anonymous', false);
    }
    const { data } = await query;
    setRows((data ?? []) as ProfileRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void loadUsers();
  }, [onlyRegistered]);

  const toggleFlag = async (row: ProfileRow, field: 'is_premium' | 'is_verified_priest') => {
    if (!supabase) return;
    await supabase
      .from('profiles')
      .update({ [field]: !row[field], updated_at: new Date().toISOString() })
      .eq('id', row.id);
    await loadUsers();
  };

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase().replace(/^@/, '');
    return (
      (r.username ?? '').toLowerCase().includes(s) ||
      (r.display_name ?? '').toLowerCase().includes(s) ||
      (r.country ?? '').toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios y Comunidad</h1>
          <p className="page-sub">
            Buscá jugadores por @usuario o país, otorgá acceso Pro o activá la insignia de Sacerdote.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: 12, top: 14, color: 'var(--ink2)' }}
          />
          <input
            className="input"
            style={{ paddingLeft: 36, width: '100%' }}
            placeholder="Buscar @usuario, nombre o país (ej. PY)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={onlyRegistered}
            onChange={(e) => setOnlyRegistered(e.target.checked)}
          />
          Solo cuentas registradas
        </label>
      </div>

      {loading ? (
        <div className="card">Cargando jugadores…</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Jugador</th>
                <th>País</th>
                <th>XP / Racha</th>
                <th>Plan / Insignias</th>
                <th>Ingreso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.display_name || 'Peregrino'}</strong>
                    <div style={{ fontSize: 13, color: 'var(--primary-ink)' }}>
                      {u.username ? `@${u.username}` : 'Sin @usuario'}
                    </div>
                  </td>
                  <td>{u.country ? <span className="chip">{u.country}</span> : '—'}</td>
                  <td>
                    <strong>{u.xp} XP</strong>
                    <div style={{ fontSize: 12, color: 'var(--ink2)' }}>
                      Racha: {u.streak_count} d
                    </div>
                  </td>
                  <td>
                    <div className="row-actions">
                      {u.is_premium ? (
                        <span className="chip gold">
                          <Crown size={12} /> Pro
                        </span>
                      ) : (
                        <span className="chip">Gratis</span>
                      )}
                      {u.is_verified_priest ? (
                        <span className="chip blue">
                          <ShieldCheck size={12} /> Sacerdote
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--ink2)' }}>
                    {new Date(u.created_at).toLocaleDateString('es-PY')}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => void toggleFlag(u, 'is_premium')}
                      >
                        {u.is_premium ? 'Quitar Pro' : 'Dar Pro'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => void toggleFlag(u, 'is_verified_priest')}
                      >
                        {u.is_verified_priest ? 'Quitar Sacerdote' : 'Sello Sacerdote'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
