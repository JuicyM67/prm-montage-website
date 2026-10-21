import { useApi } from '../api';
import { number } from '../format';
import { Delta, SetupHint } from './shared';

interface Totals { users: number; sessions: number; pageViews: number; keyEvents: number }
interface AnalyticsData {
  configured: boolean;
  error?: string;
  totals?: Totals;
  previous?: Totals;
  channels?: { channel: string; sessions: number }[];
  landing?: { page: string; sessions: number; users: number; keyEvents: number }[];
}

export default function Visitors() {
  const { data, loading, error } = useApi<AnalyticsData>('/api/admin/analytics');
  const t = data?.totals;
  const p = data?.previous;
  const maxChannel = Math.max(1, ...(data?.channels?.map((c) => c.sessions) ?? [1]));

  return (
    <>
      <div className="adm-head-wrap">
        <h1 className="adm-h1">Besökare</h1>
        <p className="adm-sub" style={{ marginBottom: 0 }}>Google Analytics · senaste 28 dagarna jämfört med perioden före</p>
      </div>

      {error && <div className="adm-alert error" role="alert">{error}</div>}
      {data?.error && <div className="adm-alert error" role="alert">{data.error}</div>}
      {data && !data.configured && <SetupHint what="Google Analytics" env="GA4_PROPERTY_ID" />}
      {loading && !data && <div className="adm-skeleton" />}

      {data?.configured && t && p && (
        <>
          <p className="adm-hint" style={{ marginTop: -12, marginBottom: 20 }}>Räknar bara besökare som godkänt statistik-cookies.</p>
          <div className="adm-stats">
            <div className="adm-stat"><div className="adm-stat-num">{number(t.users)}<Delta cur={t.users} prev={p.users} /></div><div className="adm-stat-label">Besökare</div></div>
            <div className="adm-stat"><div className="adm-stat-num">{number(t.sessions)}<Delta cur={t.sessions} prev={p.sessions} /></div><div className="adm-stat-label">Sessioner</div></div>
            <div className="adm-stat"><div className="adm-stat-num">{number(t.pageViews)}<Delta cur={t.pageViews} prev={p.pageViews} /></div><div className="adm-stat-label">Sidvisningar</div></div>
            <div className="adm-stat"><div className="adm-stat-num">{number(t.keyEvents)}<Delta cur={t.keyEvents} prev={p.keyEvents} /></div><div className="adm-stat-label">Nyckelhändelser</div></div>
          </div>

          <div className="adm-grid-2" style={{ alignItems: 'start' }}>
            <section className="adm-card">
              <div className="adm-card-head"><h2 className="adm-card-title">Trafikkällor</h2></div>
              <ul className="adm-list">
                {data.channels?.length === 0 && <li className="adm-empty">Ingen data än.</li>}
                {data.channels?.map((c) => (
                  <li key={c.channel} style={{ display: 'block' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span>{c.channel}</span><span className="adm-cell-sub">{number(c.sessions)}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: '#E7EEEC' }}>
                      <div style={{ height: 6, borderRadius: 3, background: 'var(--adm-accent)', width: `${(c.sessions / maxChannel) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="adm-card">
              <div className="adm-card-head"><h2 className="adm-card-title">Toppsidor (landning)</h2></div>
              <ul className="adm-list">
                {data.landing?.length === 0 && <li className="adm-empty">Ingen data än.</li>}
                {data.landing?.map((l) => (
                  <li key={l.page}>
                    <span className="grow adm-truncate">{l.page}</span>
                    <span className="when">{number(l.sessions)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </>
  );
}
