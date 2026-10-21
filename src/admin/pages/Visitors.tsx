import { useApi } from '../api';
import { number, pathOf, percent, periodRange } from '../format';
import { PeriodPicker, usePeriod } from '../period';
import { SplitBar } from '../components/SplitBar';
import { StatTile } from '../components/StatTile';
import { TabbedTable } from '../components/TabbedTable';
import { Delta, SetupHint } from './shared';

interface Totals { users: number; sessions: number; pageViews: number; engagementRate: number }
interface AnalyticsData {
  configured: boolean;
  empty?: boolean;
  error?: string;
  period?: { label: string; start: string; end: string };
  totals?: Totals;
  previous?: Totals;
  series?: { date: string; users: number; sessions: number }[];
  channels?: { channel: string; sessions: number; prevSessions: number }[];
  devices?: { device: string; sessions: number }[];
  pages?: { page: string; sessions: number; users: number; prevSessions: number }[];
  cities?: { city: string; users: number }[];
}

const CHANNELS: Record<string, string> = {
  'Organic Search': 'Google (organiskt)',
  Direct: 'Direkt',
  Referral: 'Länkar från andra sajter',
  'Organic Social': 'Sociala medier',
  'Paid Social': 'Betalda sociala medier',
  'Paid Search': 'Betald sökning',
  Email: 'E-post',
  Display: 'Display',
  Unassigned: 'Okänd',
};
const DEVICES: Record<string, string> = { mobile: 'Mobil', desktop: 'Dator', tablet: 'Surfplatta' };

export default function Visitors() {
  const [period, setPeriod] = usePeriod();
  const { data, loading, error } = useApi<AnalyticsData>(`/api/admin/analytics?period=${period}`);
  const t = data?.totals;
  const p = data?.previous;
  const s = data?.series ?? [];

  return (
    <>
      <div className="adm-head-wrap adm-head">
        <div>
          <h1 className="adm-h1">Besökare</h1>
          <p className="adm-sub" style={{ marginBottom: 0 }}>
            Google Analytics{data?.period ? ` · ${data.period.label} (${periodRange(data.period.start, data.period.end)})` : ''}
          </p>
        </div>
        <PeriodPicker value={period} onChange={setPeriod} />
      </div>

      {error && <div className="adm-alert error" role="alert">{error}</div>}
      {data?.error && <div className="adm-alert error" role="alert">{data.error}</div>}
      {data && !data.configured && <SetupHint what="Google Analytics" env="GA4_PROPERTY_ID" />}
      {data?.empty && <div className="adm-alert" role="status">För tidigt i perioden — det finns ingen data än. Välj en längre period.</div>}

      {data?.configured && t && p && (
        <div style={{ opacity: loading ? 0.55 : 1, transition: 'opacity .15s' }}>
          <div className="adm-stats">
            <StatTile label="Besökare" value={number(t.users)} cur={t.users} prev={p.users} series={s.map((d) => d.users)} />
            <StatTile label="Sessioner" value={number(t.sessions)} cur={t.sessions} prev={p.sessions} series={s.map((d) => d.sessions)} />
            <StatTile label="Sidvisningar" value={number(t.pageViews)} cur={t.pageViews} prev={p.pageViews} />
            <StatTile label="Engagemang" value={percent(t.engagementRate, 0)} cur={t.engagementRate} prev={p.engagementRate} />
          </div>

          <div className="adm-grid-2" style={{ alignItems: 'start', marginBottom: 16 }}>
            <SplitBar
              title="Var kommer de ifrån?"
              items={(data.channels ?? []).map((c) => ({ label: CHANNELS[c.channel] ?? c.channel, value: c.sessions, prev: c.prevSessions }))}
            />
            <SplitBar
              title="Mobil eller dator?"
              items={(data.devices ?? []).map((d) => ({ label: DEVICES[d.device] ?? d.device, value: d.sessions }))}
            />
          </div>

          <TabbedTable
            tabs={[
              {
                id: 'pages',
                label: 'Toppsidor',
                rows: data.pages ?? [],
                searchText: (r: NonNullable<AnalyticsData['pages']>[number]) => r.page,
                columns: [
                  { label: 'Landningssida', render: (r) => <div className="adm-truncate adm-cell-main">{pathOf(r.page)}</div> },
                  { label: 'Sessioner', align: 'right', render: (r) => <>{number(r.sessions)} <Delta cur={r.sessions} prev={r.prevSessions} /></> },
                  { label: 'Besökare', align: 'right', render: (r) => number(r.users) },
                ],
              },
              {
                id: 'cities',
                label: 'Städer',
                rows: data.cities ?? [],
                searchText: (r: NonNullable<AnalyticsData['cities']>[number]) => r.city,
                columns: [
                  { label: 'Stad', render: (r) => <span className="adm-cell-main">{r.city}</span> },
                  { label: 'Besökare', align: 'right', render: (r) => number(r.users) },
                ],
              },
            ]}
          />
          <p className="adm-hint" style={{ marginTop: 12 }}>Räknar bara besökare som godkänt statistik-cookies, så siffrorna är lägre än den verkliga trafiken.</p>
        </div>
      )}
      {loading && !data && <div className="adm-skeleton" />}
    </>
  );
}
