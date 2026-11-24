import {
  Bell,
  BookOpen,
  Calendar,
  Crown,
  Flag,
  HelpCircle,
  Newspaper,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';

interface Metrics {
  usersTotal: number;
  usersRegistered: number;
  usersPro: number;
  questionsActive: number;
  dailyCount: number;
  referencesCount: number;
  openReports: number;
  newsCount: number;
  campaignsSent: number;
}

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!supabase) return;
      setLoading(true);
      const [
        usersTotal,
        usersRegistered,
        usersPro,
        questionsActive,
        dailyCount,
        referencesCount,
        openReports,
        newsCount,
        campaignsSent,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('is_anonymous', false),
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('is_premium', true),
        supabase
          .from('questions')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase.from('daily_challenges').select('id', { count: 'exact', head: true }),
        supabase.from('reference_texts').select('id', { count: 'exact', head: true }),
        supabase
          .from('question_reports')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'open'),
        supabase
          .from('news_quizzes')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('notification_campaigns')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'sent'),
      ]);

      setMetrics({
        usersTotal: usersTotal.count ?? 0,
        usersRegistered: usersRegistered.count ?? 0,
        usersPro: usersPro.count ?? 0,
        questionsActive: questionsActive.count ?? 0,
        dailyCount: dailyCount.count ?? 0,
        referencesCount: referencesCount.count ?? 0,
        openReports: openReports.count ?? 0,
        newsCount: newsCount.count ?? 0,
        campaignsSent: campaignsSent.count ?? 0,
      });
      setLoading(false);
    }
    void load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Resumen general</h1>
          <p className="page-sub">
            Estado en vivo de Trivia Católica · contenido, comunidad y envíos.
          </p>
        </div>
      </div>

      {loading || !metrics ? (
        <div className="card">Cargando métricas desde Supabase…</div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={20} />
              </div>
              <div className="stat-value">{metrics.usersRegistered}</div>
              <div className="stat-label">
                Cuentas registradas ({metrics.usersTotal} totales)
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon gold">
                <Crown size={20} />
              </div>
              <div className="stat-value">{metrics.usersPro}</div>
              <div className="stat-label">Usuarios Pro activos</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <HelpCircle size={20} />
              </div>
              <div className="stat-value">{metrics.questionsActive}</div>
              <div className="stat-label">Preguntas activas</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <Calendar size={20} />
              </div>
              <div className="stat-value">{metrics.dailyCount}</div>
              <div className="stat-label">Desafíos diarios cargados</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <BookOpen size={20} />
              </div>
              <div className="stat-value">{metrics.referencesCount}</div>
              <div className="stat-label">Citas Biblia / CIC / IGMR</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon red">
                <Flag size={20} />
              </div>
              <div className="stat-value">{metrics.openReports}</div>
              <div className="stat-label">Reportes doctrinales abiertos</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Newspaper size={20} />
              </div>
              <div className="stat-value">{metrics.newsCount}</div>
              <div className="stat-label">Noticias con mini-quiz</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon gold">
                <Bell size={20} />
              </div>
              <div className="stat-value">{metrics.campaignsSent}</div>
              <div className="stat-label">Campañas Push enviadas</div>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title">Accesos rápidos</h2>
            <div className="toolbar" style={{ marginBottom: 0 }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onNavigate('daily')}
              >
                <Calendar size={17} /> Programar Desafío del Día
              </button>
              <button
                type="button"
                className="btn btn-soft"
                onClick={() => onNavigate('notifications')}
              >
                <Bell size={17} /> Enviar Notificación Push
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => onNavigate('questions')}
              >
                <HelpCircle size={17} /> Agregar Pregunta
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => onNavigate('reports')}
              >
                <Flag size={17} /> Revisar Reportes ({metrics.openReports})
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
