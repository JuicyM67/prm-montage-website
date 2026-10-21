import { useApi } from '../api';
import { decimal, number, pathOf, percent, periodRange } from '../format';
import { PeriodPicker, usePeriod } from '../period';
import { DistributionBar } from '../components/DistributionBar';
import { MovementCard, type Move } from '../components/MovementCard';
import { StatTile } from '../components/StatTile';
import { TabbedTable } from '../components/TabbedTable';
import { SetupHint } from './shared';

interface Metrics { clicks: number; impressions: number; ctr: number; position: number }
interface Row extends Metrics { prevPosition: number | null; delta: number | null; query?: string; page?: string }
interface SeoData {
  configured: boolean;
  empty?: boolean;
  error?: string;
  period?: { id: string; label: string; start: string; end: string };
  totals?: Metrics;
  previous?: Metrics;
  hasPrevious?: boolean;
  series?: ({ date: string } & Metrics)[];
  movements?: { climbers: Move[]; fallers: Move[]; fresh: Move[]; nearTop10: Move[] };
  distribution?: { current: { id: string; label: string; count: number }[]; previous: { id: string; label: string; count: number }[] | null };
  queries?: Row[];
  pages?: Row[];
}

// Positionen + hur den ändrats mot föregående period (lägre position är bättre).
function Position({ row, comparable }: { row: Row; comparable: boolean }) {
  return (
    <>
      {decimal(row.position)}
      {row.delta !== null && Math.abs(row.delta) >= 0.05 && (
        <span className={`adm-chip ${row.delta > 0 ? 'up' : 'down'}`} style={{ marginLeft: 8 }}>
          {row.delta > 0 ? '▲' : '▼'} {decimal(Math.abs(row.delta))}
        </span>
      )}
      {comparable && row.prevPosition === null && <span className="adm-chip new" style={{ marginLeft: 8 }}>Ny</span>}
    </>
  );
}

export default function Queries() {
  const [period, setPeriod] = usePeriod();
  const { data, loading, error } = useApi<SeoData>(`/api/admin/seo?period=${period}`);
  const t = data?.totals;
  const p = data?.previous;
  const s = data?.series ?? [];
  const m = data?.movements;
  const comparable = data?.hasPrevious !== false;

  return (
    <>
      <div className="adm-head-wrap">
        <div>
          <h1 className="adm-h1">Sökord & ranking</h1>
          <p className="adm-sub" style={{ marginBottom: 0 }}>
            Google Search Console{data?.period ? ` · ${data.period.label} (${periodRange(data.period.start, data.period.end)})` : ''}
          </p>
        </div>
        <div className="adm-period-row"><PeriodPicker value={period} onChange={setPeriod} /></div>
      </div>

      {error && <div className="adm-alert error" role="alert">{error}</div>}
      {data?.error && <div className="adm-alert error" role="alert">{data.error}</div>}
      {data && !data.configured && <SetupHint what="Search Console" env="GSC_SITE_URL" />}
      {data?.empty && <div className="adm-alert" role="status">För tidigt i perioden — Google släpar ungefär två dygn, så det finns ingen data än. Välj en längre period.</div>}

      {data?.configured && t && p && m && (
        <div style={{ opacity: loading ? 0.55 : 1, transition: 'opacity .15s' }}>
          <div className="adm-stats">
            <StatTile label="Klick från Google" value={number(t.clicks)} cur={t.clicks} prev={p.clicks} series={s.map((d) => d.clicks)} />
            <StatTile label="Visningar" value={number(t.impressions)} cur={t.impressions} prev={p.impressions} series={s.map((d) => d.impressions)} />
            <StatTile label="Klickfrekvens" value={percent(t.ctr)} cur={t.ctr} prev={p.ctr} series={s.map((d) => (d.impressions ? d.clicks / d.impressions : 0))} />
            <StatTile label="Snittposition" value={decimal(t.position)} cur={t.position} prev={p.position} invert abs series={s.filter((d) => d.impressions > 0).map((d) => d.position)} />
          </div>

          {data.distribution && (
            <div style={{ marginBottom: 16 }}>
              <DistributionBar current={data.distribution.current} previous={data.distribution.previous} />
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <MovementCard
              comparable={comparable}
              tabs={[
                { id: 'up', label: '▲ Klättrar', rows: m.climbers, empty: 'Inga sökord har klättrat minst en plats i perioden.' },
                { id: 'down', label: '▼ Tappar', rows: m.fallers, empty: 'Inga sökord har tappat minst en plats.' },
                { id: 'fresh', label: 'Nya', rows: m.fresh, empty: 'Inga nya sökord i perioden.' },
                { id: 'near', label: 'Nära topp 10', rows: m.nearTop10, empty: 'Inga sökord på plats 11–20 än.', hint: 'Sökord på plats 11–20 med flest visningar — närmast att nå första sidan.' },
              ]}
            />
          </div>

          <TabbedTable
            tabs={[
              {
                id: 'queries',
                label: 'Sökord',
                rows: data.queries ?? [],
                searchText: (r: Row) => r.query ?? '',
                empty: 'Inga sökord i perioden.',
                columns: [
                  { label: 'Sökord', render: (r: Row) => <span className="adm-cell-main">{r.query}</span> },
                  { label: 'Position', align: 'right', render: (r: Row) => <Position row={r} comparable={comparable} /> },
                  { label: 'Klick', align: 'right', render: (r: Row) => number(r.clicks) },
                  { label: 'Visningar', align: 'right', render: (r: Row) => number(r.impressions) },
                ],
              },
              {
                id: 'pages',
                label: 'Sidor',
                rows: data.pages ?? [],
                searchText: (r: Row) => r.page ?? '',
                empty: 'Inga sidor i perioden.',
                columns: [
                  { label: 'Sida', render: (r: Row) => <div className="adm-truncate adm-cell-main">{pathOf(r.page ?? '')}</div> },
                  { label: 'Position', align: 'right', render: (r: Row) => <Position row={r} comparable={comparable} /> },
                  { label: 'Klick', align: 'right', render: (r: Row) => number(r.clicks) },
                  { label: 'Visningar', align: 'right', render: (r: Row) => number(r.impressions) },
                ],
              },
            ]}
          />
          <p className="adm-hint" style={{ marginTop: 12 }}>
            Snittposition är ett genomsnitt över alla visningar, så den kan svänga från dag till dag. Rörelser räknas bara för sökord med minst 5 visningar i båda perioderna. Google döljer sällsynta sökord, därför är summan av listan lägre än totalen.
          </p>
        </div>
      )}
      {loading && !data && <div className="adm-skeleton" />}
    </>
  );
}
