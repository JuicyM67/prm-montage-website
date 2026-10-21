import { useApi } from '../api';
import { describeActivity, number, periodRange, timeAgo } from '../format';
import { PeriodPicker, usePeriod } from '../period';
import type { AdminUser } from '../Shell';
import { Delta } from './shared';

interface OverviewData {
  leadsNew: number;
  leadsStale: number;
  pendingInvites: number;
  recent: { id: number; created_at: string; action: string; subject: string | null; user_name: string | null }[];
}

interface Counts { phone: number; email: number; forms: number; total: number }
interface Conversions {
  period: { label: string; start: string; end: string };
  totals: Counts;
  previous: Counts;
  daily: { date: string; phone: number; email: number; forms: number }[];
  placements: { kind: 'phone' | 'email'; placement: string; count: number }[];
  pages: { page: string; phone: number; email: number; forms: number; total: number }[];
  formTypes: { type: string; n: number }[];
  trackingSince: string | null;
}

const COLORS = { phone: '#1F5C50', forms: '#1FA968', email: '#9FDDBF' };
const PLACEMENT_LABELS: Record<string, string> = {
  header: 'Sidhuvud',
  footer: 'Sidfot',
  menu: 'Mobilmeny',
  mobile_bar: 'Mobilknapp (nederkant)',
  modal: 'Offertfönstret',
  page: 'På sidan',
};
const KIND_LABELS = { phone: 'Samtal', email: 'Mejl' };

export default function Overview({ user }: { user: AdminUser }) {
  const [period, setPeriod] = usePeriod();
  const conv = useApi<Conversions>(`/api/admin/conversions?period=${period}`);
  const { data, error, loading } = useApi<OverviewData>('/api/admin/overview');
  const c = conv.data;

  const todo = data ? [
    { n: data.leadsNew, text: data.leadsNew === 1 ? 'ny förfrågan väntar' : 'nya förfrågningar väntar', href: '/admin/forfragningar', warn: false },
    { n: data.leadsStale, text: 'förfrågningar har väntat över 2 dygn', href: '/admin/forfragningar', warn: true },
    { n: data.pendingInvites, text: data.pendingInvites === 1 ? 'inbjudan har inte använts än' : 'inbjudningar har inte använts än', href: '/admin/anvandare', warn: false },
  ].filter((t) => t.n > 0) : [];

  // Klickmätningen har en startdag; innan dess finns bara formulär. Säg det i stället för att visa vilseledande nollor.
  const periodStart = c?.daily[0]?.date;
  const sinceDay = c?.trackingSince ? c.trackingSince.slice(0, 10) : null;
  const partial = c && (!sinceDay || (periodStart && sinceDay > periodStart));

  return (
    <>
      <div className="adm-head-wrap adm-head">
        <div>
          <h1 className="adm-h1">Hej{user.name ? `, ${user.name.split(' ')[0]}` : ''}</h1>
          <p className="adm-sub" style={{ marginBottom: 0 }}>
            Vad sajten genererat{c ? ` · ${c.period.label} (${periodRange(c.period.start, c.period.end)})` : ''}
          </p>
        </div>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      {error && <div className="adm-alert error" role="alert">{error}</div>}
      {conv.error && <div className="adm-alert error" role="alert">{conv.error}</div>}

      <div className="adm-stats">
        <Stat label="Leads från sajten" value={c?.totals.total} prev={c?.previous.total} loading={conv.loading && !c} primary />
        <Stat label="Samtalsklick" value={c?.totals.phone} prev={c?.previous.phone} loading={conv.loading && !c} />
        <Stat label="Mejlklick" value={c?.totals.email} prev={c?.previous.email} loading={conv.loading && !c} />
        <Stat label="Formulär skickade" value={c?.totals.forms} prev={c?.previous.forms} loading={conv.loading && !c} />
      </div>

      {partial && (
        <div className="adm-alert" role="status">
          {sinceDay
            ? `Samtals- och mejlklick räknas sedan ${new Date(sinceDay).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })}. Dagarna före visar bara formulär.`
            : 'Samtals- och mejlklick har inte börjat räknas än — de dyker upp här så fort någon klickar på ett nummer eller en mejladress.'}
        </div>
      )}

      {c && (
        <section className="adm-card" style={{ marginBottom: 16 }}>
          <div className="adm-card-head">
            <h2 className="adm-card-title">Leads per dag</h2>
            <Legend totals={c.totals} />
          </div>
          <Chart daily={c.daily} />
          <p className="adm-hint" style={{ margin: '12px 0 0' }}>Ett klick på numret är inte samma sak som ett genomfört samtal.</p>
        </section>
      )}

      {c && (
        <div className="adm-grid-2" style={{ marginBottom: 16, alignItems: 'start' }}>
          <section className="adm-card">
            <div className="adm-card-head"><h2 className="adm-card-title">Var klickar de?</h2></div>
            {c.placements.length === 0 ? <p className="adm-empty">Inga klick i perioden.</p> : (
              <ul className="adm-list">
                {c.placements.map((p) => (
                  <li key={p.kind + p.placement}>
                    <span className="grow">{KIND_LABELS[p.kind]} · {PLACEMENT_LABELS[p.placement] ?? p.placement}</span>
                    <strong>{number(p.count)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="adm-card">
            <div className="adm-card-head"><h2 className="adm-card-title">Sidor som ger mest</h2></div>
            {c.pages.length === 0 ? <p className="adm-empty">Inga leads i perioden.</p> : (
              <ul className="adm-list">
                {c.pages.map((p) => (
                  <li key={p.page}>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="adm-truncate" style={{ maxWidth: '100%' }}>{p.page}</div>
                      <div className="adm-cell-sub">{[p.phone && `${p.phone} samtal`, p.email && `${p.email} mejl`, p.forms && `${p.forms} formulär`].filter(Boolean).join(' · ')}</div>
                    </div>
                    <strong>{number(p.total)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

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

function Stat({ label, value, prev, loading, primary }: { label: string; value: number | undefined; prev: number | undefined; loading: boolean; primary?: boolean }) {
  return (
    <div className={`adm-stat${primary ? ' is-primary' : ''}`}>
      <div className="adm-stat-num">
        {loading ? <div className="adm-skeleton" style={{ width: 60, height: 30 }} /> : (
          <>{number(value ?? 0)}{value != null && prev != null && <Delta cur={value} prev={prev} />}</>
        )}
      </div>
      <div className="adm-stat-label">{label}</div>
    </div>
  );
}

function Legend({ totals }: { totals: Counts }) {
  const items = [
    { key: 'phone', label: 'Samtal', n: totals.phone },
    { key: 'email', label: 'Mejl', n: totals.email },
    { key: 'forms', label: 'Formulär', n: totals.forms },
  ] as const;
  return (
    <div className="adm-legend">
      {items.map((i) => (
        <span key={i.key}><i style={{ background: COLORS[i.key] }} />{i.label} {number(i.n)}</span>
      ))}
    </div>
  );
}

// Staplat stapeldiagram i ren SVG. Varje stapel har en <title> (visas vid hover) med dagens siffror.
function Chart({ daily }: { daily: Conversions['daily'] }) {
  const W = 900;
  const H = 180;
  const max = Math.max(1, ...daily.map((d) => d.phone + d.email + d.forms));
  const slot = W / daily.length;
  const bar = Math.max(2, slot * 0.7);
  const fmt = (d: string) => new Date(d).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
  const describe = (d: Conversions['daily'][number]) =>
    `${fmt(d.date)}: ${d.phone} samtal, ${d.email} mejl, ${d.forms} formulär`;

  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Leads per dag: samtal, mejl och formulär" style={{ display: 'block' }}>
        <line x1="0" x2={W} y1={H - 0.5} y2={H - 0.5} stroke="#E1E9E7" />
        <line x1="0" x2={W} y1={0.5} y2={0.5} stroke="#E1E9E7" strokeDasharray="3 4" />
        {daily.map((d, i) => {
          const x = i * slot + (slot - bar) / 2;
          let y = H;
          const segments = ([['phone', d.phone], ['forms', d.forms], ['email', d.email]] as const).map(([key, n]) => {
            const h = (n / max) * (H - 6);
            y -= h;
            return n > 0 ? <rect key={key} x={x} y={y} width={bar} height={h} fill={COLORS[key]} rx={bar > 6 ? 2 : 0} /> : null;
          });
          return (
            <g key={d.date}>
              <title>{describe(d)}</title>
              <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
              {segments}
            </g>
          );
        })}
      </svg>
      <figcaption style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--adm-muted)', marginTop: 6 }}>
        <span>{fmt(daily[0].date)}</span>
        <span>Högst {max} per dag</span>
        <span>{fmt(daily[daily.length - 1].date)}</span>
      </figcaption>
    </figure>
  );
}
