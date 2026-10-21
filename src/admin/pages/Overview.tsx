import { useApi } from '../api';
import { describeActivity, number, timeAgo } from '../format';
import type { AdminUser } from '../Shell';

interface OverviewData {
  leads7d: number;
  leadsNew: number;
  leadsTotal: number;
  leadsStale: number;
  users: number;
  pendingInvites: number;
  recent: { id: number; created_at: string; action: string; subject: string | null; user_name: string | null }[];
}

export default function Overview({ user }: { user: AdminUser }) {
  const { data, error, loading } = useApi<OverviewData>('/api/admin/overview');
  const seo = useApi<{ configured: boolean; totals?: { clicks: number; impressions: number; position: number } }>('/api/admin/seo');

  const todo = data ? [
    { n: data.leadsNew, text: data.leadsNew === 1 ? 'ny förfrågan väntar' : 'nya förfrågningar väntar', href: '/admin/forfragningar', warn: false },
    { n: data.leadsStale, text: 'förfrågningar har väntat över 2 dygn', href: '/admin/forfragningar', warn: true },
    { n: data.pendingInvites, text: data.pendingInvites === 1 ? 'inbjudan har inte använts än' : 'inbjudningar har inte använts än', href: '/admin/anvandare', warn: false },
  ].filter((t) => t.n > 0) : [];

  return (
    <>
      <div className="adm-head-wrap">
        <h1 className="adm-h1">Hej{user.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
        <p className="adm-sub" style={{ marginBottom: 0 }}>Läget på prmmontage.se just nu</p>
      </div>

      {error && <div className="adm-alert error" role="alert">{error}</div>}

      <div className="adm-stats">
        <Stat value={data?.leads7d} label="Förfrågningar, senaste 7 dagarna" loading={loading} />
        <Stat value={data?.leadsNew} label="Obehandlade förfrågningar" loading={loading} />
        <Stat value={seo.data?.configured ? seo.data.totals?.clicks : undefined} label="Klick från Google, 28 dagar" loading={seo.loading} empty="–" />
        <Stat value={seo.data?.configured ? seo.data.totals?.position : undefined} label="Snittposition i Google" loading={seo.loading} empty="–" decimals={1} />
      </div>

      <div className="adm-grid-2">
        <section className="adm-card">
          <div className="adm-card-head"><h2 className="adm-card-title">Behöver åtgärd</h2></div>
          {loading ? <div className="adm-skeleton" /> : todo.length === 0 ? (
            <p className="adm-empty">Inget just nu — allt är under kontroll.</p>
          ) : (
            <ul className="adm-list">
              {todo.map((t) => (
                <li key={t.text}>
                  <span className={`adm-count${t.warn ? ' warn' : ''}`}>{t.n}</span>
                  <a className="grow" href={t.href} style={{ textDecoration: 'none' }}>{t.text}</a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="adm-card">
          <div className="adm-card-head">
            <h2 className="adm-card-title">Senaste aktivitet</h2>
            <a className="adm-card-link" href="/admin/aktivitet">Hela loggen</a>
          </div>
          {loading ? <div className="adm-skeleton" /> : data && data.recent.length === 0 ? (
            <p className="adm-empty">Ingen aktivitet än.</p>
          ) : (
            <ul className="adm-list">
              {data?.recent.map((a) => (
                <li key={a.id}>
                  <span className="grow">{describeActivity(a)}</span>
                  <span className="when">{timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function Stat({ value, label, loading, empty = '0', decimals = 0 }: { value: number | undefined; label: string; loading: boolean; empty?: string; decimals?: number }) {
  return (
    <div className="adm-stat">
      <div className="adm-stat-num">
        {loading ? <div className="adm-skeleton" style={{ width: 60, height: 30 }} /> : value == null ? empty : decimals ? value.toLocaleString('sv-SE', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) : number(value)}
      </div>
      <div className="adm-stat-label">{label}</div>
    </div>
  );
}
