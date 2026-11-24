import type { Session } from '@supabase/supabase-js';
import {
  Bell,
  BookOpen,
  Calendar,
  Flag,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Users,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { isSupabaseConfigured, supabase } from './lib/supabase';
import { BannersNewsPage } from './pages/BannersNewsPage';
import { DailyChallengesPage } from './pages/DailyChallengesPage';
import { DashboardPage } from './pages/DashboardPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { QuestionsPage } from './pages/QuestionsPage';
import { ReferencesPage } from './pages/ReferencesPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';

type TabId =
  | 'dashboard'
  | 'daily'
  | 'questions'
  | 'references'
  | 'banners'
  | 'reports'
  | 'users'
  | 'notifications';

const NAV_ITEMS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'daily', label: 'Desafío del Día', icon: Calendar },
  { id: 'questions', label: 'Preguntas', icon: HelpCircle },
  { id: 'references', label: 'Fuentes Biblia/CIC', icon: BookOpen },
  { id: 'banners', label: 'Banners y Noticias', icon: Megaphone },
  { id: 'reports', label: 'Reportes', icon: Flag },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'notifications', label: 'Notificaciones Push', icon: Bell },
];

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [tab, setTab] = useState<TabId>('dashboard');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const verifyAdminSession = async (currentSession: Session | null) => {
    if (!supabase || !currentSession) {
      setSession(null);
      setIsAdmin(false);
      setCheckingAuth(false);
      return;
    }
    const { data, error } = await supabase.rpc('is_admin');
    if (error || !data) {
      setAuthError(
        'Esta cuenta no tiene permisos de administrador. Ejecutá la Migración 009 en Supabase y verificá tu correo en public.admin_users.'
      );
      await supabase.auth.signOut();
      setSession(null);
      setIsAdmin(false);
    } else {
      setAuthError(null);
      setSession(currentSession);
      setIsAdmin(true);
    }
    setCheckingAuth(false);
  };

  useEffect(() => {
    if (!supabase) {
      setCheckingAuth(false);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      void verifyAdminSession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void verifyAdminSession(nextSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setAuthError(null);
    setSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setSigningIn(false);
    if (error) {
      setAuthError(error.message);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand">
            <div className="brand-mark">TC</div>
            <div>
              <div className="brand-title">Trivia Católica Admin</div>
              <div className="brand-sub">app.triviacatolica.com</div>
            </div>
          </div>
          <div className="alert error">
            Faltan las variables <code>VITE_SUPABASE_URL</code> y{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> en <code>admin/.env.local</code> (o en Vercel).
          </div>
        </div>
      </div>
    );
  }

  if (checkingAuth) {
    return (
      <div className="login-page">
        <div className="card">Verificando sesión de administrador…</div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div className="login-page">
        <form className="login-card" onSubmit={(e) => void handleLogin(e)}>
          <div className="brand" style={{ padding: 0 }}>
            <div className="brand-mark">TC</div>
            <div>
              <div className="brand-title">Trivia Católica</div>
              <div className="brand-sub">Panel de administración · Lienzo</div>
            </div>
          </div>

          {authError ? <div className="alert error">{authError}</div> : null}

          <div className="field">
            <label className="label">Correo administrador</label>
            <input
              type="email"
              required
              className="input"
              placeholder="tu-correo@triviacatolica.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="label">Contraseña</label>
            <input
              type="password"
              required
              className="input"
              placeholder="Tu contraseña de Supabase Auth"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={signingIn}>
            {signingIn ? 'Ingresando…' : 'Ingresar al panel'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">TC</div>
          <div>
            <div className="brand-title">Trivia Católica</div>
            <div className="brand-sub">app.triviacatolica.com</div>
          </div>
        </div>

        <nav className="nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`nav-btn ${tab === item.id ? 'active' : ''}`}
                onClick={() => setTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          <div className="admin-email">{session.user.email}</div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => void supabase?.auth.signOut()}
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main">
        {tab === 'dashboard' ? (
          <DashboardPage onNavigate={(next) => setTab(next as TabId)} />
        ) : null}
        {tab === 'daily' ? <DailyChallengesPage /> : null}
        {tab === 'questions' ? <QuestionsPage /> : null}
        {tab === 'references' ? <ReferencesPage /> : null}
        {tab === 'banners' ? <BannersNewsPage /> : null}
        {tab === 'reports' ? <ReportsPage /> : null}
        {tab === 'users' ? <UsersPage /> : null}
        {tab === 'notifications' ? <NotificationsPage /> : null}
      </main>
    </div>
  );
}
