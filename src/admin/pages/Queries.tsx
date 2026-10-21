import { useApi } from '../api';
import { number } from '../format';
import { Delta, SetupHint } from './shared';

interface Metrics { clicks: number; impressions: number; ctr: number; position: number }
interface SeoData {
  configured: boolean;
  error?: string;
  period?: { startDate: string; endDate: string };
  totals?: Metrics;
  previous?: Metrics;
  queries?: ({ query: string } & Metrics)[];
  pages?: ({ page: string } & Metrics)[];
}

const pos = (n: number) => n.toLocaleString('sv-SE', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const pct = (n: number) => (n * 100).toLocaleString('sv-SE', { maximumFractionDigits: 1 }) + ' %';
const path = (url: string) => url.replace(/^https?:\/\/[^/]+/, '') || '/';

export default function Queries() {
  const { data, loading, error } = useApi<SeoData>('/api/admin/seo');
  const t = data?.totals;
  const p = data?.previous;

  return (
    <>
      <div className="adm-head-wrap">
        <h1 className="adm-h1">Sökord & ranking</h1>
        <p className="adm-sub" style={{ marginBottom: 0 }}>
          Google Search Console{data?.period ? ` · ${data.period.startDate} – ${data.period.endDate}` : ' · senaste 28 dagarna'}
        </p>
      </div>

      {error && <div className="adm-alert error" role="alert">{error}</div>}
      {data?.error && <div className="adm-alert error" role="alert">{data.error}</div>}
      {data && !data.configured && <SetupHint what="Search Console" env="GSC_SITE_URL" />}
      {loading && !data && <div className="adm-skeleton" />}

      {data?.configured && t && p && (
        <>
          <div className="adm-stats">
            <div className="adm-stat"><div className="adm-stat-num">{number(t.clicks)}<Delta cur={t.clicks} prev={p.clicks} /></div><div className="adm-stat-label">Klick</div></div>
            <div className="adm-stat"><div className="adm-stat-num">{number(t.impressions)}<Delta cur={t.impressions} prev={p.impressions} /></div><div className="adm-stat-label">Visningar</div></div>
            <div className="adm-stat"><div className="adm-stat-num">{pct(t.ctr)}</div><div className="adm-stat-label">Klickfrekvens</div></div>
            <div className="adm-stat"><div className="adm-stat-num">{pos(t.position)}<Delta cur={t.position} prev={p.position} invert /></div><div className="adm-stat-label">Snittposition</div></div>
          </div>

          <h2 className="adm-card-title" style={{ margin: '8px 0 12px' }}>Sökord</h2>
          <div className="adm-table-wrap" style={{ marginBottom: 24 }}>
            <table className="adm-table">
              <thead><tr><th>Sökord</th><th className="num">Position</th><th className="num">Klick</th><th className="num">Visningar</th><th className="num">CTR</th></tr></thead>
              <tbody>
                {data.queries?.length === 0 && <tr><td colSpan={5} className="adm-empty">Inga sökord än.</td></tr>}
                {data.queries?.map((q) => (
                  <tr key={q.query}>
                    <td className="adm-cell-main">{q.query}</td>
                    <td className="num">{pos(q.position)}</td>
                    <td className="num">{number(q.clicks)}</td>
                    <td className="num">{number(q.impressions)}</td>
                    <td className="num">{pct(q.ctr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="adm-card-title" style={{ margin: '8px 0 12px' }}>Sidor</h2>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Sida</th><th className="num">Position</th><th className="num">Klick</th><th className="num">Visningar</th></tr></thead>
              <tbody>
                {data.pages?.map((r) => (
                  <tr key={r.page}>
                    <td className="adm-cell-main"><div className="adm-truncate">{path(r.page)}</div></td>
                    <td className="num">{pos(r.position)}</td>
                    <td className="num">{number(r.clicks)}</td>
                    <td className="num">{number(r.impressions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
