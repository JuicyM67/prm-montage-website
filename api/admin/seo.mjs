import { guarded, json } from '../../lib/guard.mjs';
import { cached, googleConfigured, googleError, googlePost } from '../../lib/google.mjs';
import { bucketWeekly, fillDays, needsWeekly, resolvePeriod } from '../../lib/period.mjs';

// Sökord & ranking. Search Console släpar ~2 dygn, så perioden slutar för 2 dagar sedan.
// delta = föregående period − nu i snittposition: positivt = klättrat (lägre position är bättre).
const ROW_LIMIT = 1000;
const MIN_IMPRESSIONS = 5; // färre visningar än så ger bara brus i snittpositionen
const MIN_DELTA = 1; // minst en hel plats för att räknas som en rörelse

const pick = (r) => ({ clicks: r?.clicks ?? 0, impressions: r?.impressions ?? 0, ctr: r?.ctr ?? 0, position: r?.position ?? 0 });

function join(curRows, prevRows, key) {
  const prev = new Map(prevRows.map((r) => [r.keys[0], r]));
  return curRows.map((r) => {
    const p = prev.get(r.keys[0]);
    return {
      [key]: r.keys[0],
      ...pick(r),
      prevPosition: p ? p.position : null,
      prevImpressions: p ? p.impressions : 0,
      delta: p ? p.position - r.position : null,
    };
  });
}

const slim = (r) => ({ query: r.query, position: r.position, prevPosition: r.prevPosition, delta: r.delta, clicks: r.clicks, impressions: r.impressions });
const byImpressions = (a, b) => b.impressions - a.impressions;

const BUCKETS = [
  { id: 'top3', label: 'Topp 3', test: (p) => p <= 3 },
  { id: 'top10', label: '4–10', test: (p) => p > 3 && p <= 10 },
  { id: 'top20', label: '11–20', test: (p) => p > 10 && p <= 20 },
  { id: 'rest', label: '21+', test: (p) => p > 20 },
];
const distribution = (rows) => BUCKETS.map((b) => ({ id: b.id, label: b.label, count: rows.filter((r) => b.test(r.position)).length }));

export const GET = guarded(async (request) => {
  const site = process.env.GSC_SITE_URL;
  if (!googleConfigured() || !site) return json({ configured: false });

  const period = resolvePeriod(new URL(request.url).searchParams.get('period'), { lagDays: 2 });
  if (period.empty) return json({ configured: true, empty: true, period });

  try {
    const data = await cached(`seo:${period.id}:${period.end}`, 60 * 60 * 1000, async () => {
      const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
      const cur = { startDate: period.start, endDate: period.end };
      const prev = { startDate: period.prevStart, endDate: period.prevEnd };
      const [totals, prevTotals, daily, queries, prevQueries, pages, prevPages] = await Promise.all([
        googlePost(base, cur),
        googlePost(base, prev),
        googlePost(base, { ...cur, dimensions: ['date'], rowLimit: 500 }),
        googlePost(base, { ...cur, dimensions: ['query'], rowLimit: ROW_LIMIT }),
        googlePost(base, { ...prev, dimensions: ['query'], rowLimit: ROW_LIMIT }),
        googlePost(base, { ...cur, dimensions: ['page'], rowLimit: 200 }),
        googlePost(base, { ...prev, dimensions: ['page'], rowLimit: 200 }),
      ]);

      let series = (daily.rows || [])
        .map((r) => ({ date: r.keys[0], ...pick(r) }))
        .sort((a, b) => (a.date < b.date ? -1 : 1));
      series = fillDays(series, period.start, period.end, { clicks: 0, impressions: 0, ctr: 0, position: 0 });
      if (needsWeekly(period.days)) series = bucketWeekly(series, { sum: ['clicks', 'impressions'], weighted: { position: 'impressions' } });

      const queryRows = join(queries.rows || [], prevQueries.rows || [], 'query');
      const comparable = queryRows.filter((r) => r.delta !== null && r.impressions >= MIN_IMPRESSIONS && r.prevImpressions >= MIN_IMPRESSIONS);
      // "Nya" kan bara avgöras om föregående periods lista är komplett (inte avkapad av rowLimit).
      const prevComplete = (prevQueries.rows || []).length < ROW_LIMIT;
      // Utan data från föregående period (t.ex. sajten är för ny) går inget att jämföra: då blir allt "nytt".
      const hasPrevious = (prevTotals.rows?.[0]?.impressions ?? 0) > 0;

      return {
        configured: true,
        period,
        totals: pick(totals.rows?.[0]),
        previous: pick(prevTotals.rows?.[0]),
        hasPrevious,
        series,
        movements: {
          climbers: comparable.filter((r) => r.delta >= MIN_DELTA).sort((a, b) => b.delta - a.delta).slice(0, 10).map(slim),
          fallers: comparable.filter((r) => r.delta <= -MIN_DELTA).sort((a, b) => a.delta - b.delta).slice(0, 10).map(slim),
          fresh: prevComplete && hasPrevious ? queryRows.filter((r) => r.prevPosition === null && r.impressions >= MIN_IMPRESSIONS).sort(byImpressions).slice(0, 10).map(slim) : [],
          nearTop10: queryRows.filter((r) => r.position > 10.5 && r.position <= 20 && r.impressions >= MIN_IMPRESSIONS).sort(byImpressions).slice(0, 10).map(slim),
        },
        distribution: {
          current: distribution(queryRows),
          previous: hasPrevious ? distribution((prevQueries.rows || []).map((r) => pick(r))) : null,
        },
        queries: queryRows.slice(0, 100),
        pages: join(pages.rows || [], prevPages.rows || [], 'page').slice(0, 100),
      };
    });
    return json(data, 200, { 'Cache-Control': 'private, max-age=600' });
  } catch (err) {
    console.error('Search Console-fel:', err?.response?.data || err);
    return json({ configured: true, error: googleError(err) });
  }
});
