import { guarded, json } from '../../lib/guard.mjs';
import { cached, googleConfigured, googleError, googlePost } from '../../lib/google.mjs';
import { bucketWeekly, fillDays, needsWeekly, resolvePeriod } from '../../lib/period.mjs';

const num = (cell) => Number(cell?.value ?? 0);

// Rader från en rapport med två datumintervall (cur/prev): intervallets namn läggs sist i dimensionValues.
function splitRanges(rows, dims) {
  const out = new Map();
  for (const row of rows || []) {
    const key = row.dimensionValues.slice(0, dims).map((d) => d.value).join('\u0000');
    const range = row.dimensionValues[dims]?.value;
    if (range !== 'cur' && range !== 'prev') continue;
    const entry = out.get(key) ?? { keys: row.dimensionValues.slice(0, dims).map((d) => d.value), cur: [], prev: [] };
    entry[range] = row.metricValues.map(num);
    out.set(key, entry);
  }
  return [...out.values()];
}

export const GET = guarded(async (request) => {
  const property = process.env.GA4_PROPERTY_ID;
  if (!googleConfigured() || !property) return json({ configured: false });

  const period = resolvePeriod(new URL(request.url).searchParams.get('period'), { lagDays: 1 });
  if (period.empty) return json({ configured: true, empty: true, period });

  try {
    const data = await cached(`analytics:${period.id}:${period.end}`, 30 * 60 * 1000, async () => {
      const url = `https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`;
      const cur = { startDate: period.start, endDate: period.end, name: 'cur' };
      const prev = { startDate: period.prevStart, endDate: period.prevEnd, name: 'prev' };
      const both = [cur, prev];
      const bySessions = [{ metric: { metricName: 'sessions' }, desc: true }];

      const [totals, daily, channels, landing, devices, cities] = await Promise.all([
        googlePost(url, {
          dateRanges: both,
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'engagementRate' }],
        }),
        googlePost(url, { dateRanges: [cur], dimensions: [{ name: 'date' }], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }], limit: 500 }),
        googlePost(url, { dateRanges: both, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], orderBys: bySessions, limit: 40 }),
        googlePost(url, { dateRanges: both, dimensions: [{ name: 'landingPage' }], metrics: [{ name: 'sessions' }, { name: 'activeUsers' }], orderBys: bySessions, limit: 120 }),
        googlePost(url, { dateRanges: [cur], dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'sessions' }], orderBys: bySessions, limit: 6 }),
        googlePost(url, { dateRanges: [cur], dimensions: [{ name: 'city' }], metrics: [{ name: 'activeUsers' }], orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }], limit: 20 }),
      ]);

      const names = ['users', 'sessions', 'pageViews', 'engagementRate'];
      const zero = { users: 0, sessions: 0, pageViews: 0, engagementRate: 0 };
      const split = { cur: { ...zero }, prev: { ...zero } };
      for (const row of totals.rows || []) {
        const range = row.dimensionValues?.find((d) => d.value === 'cur' || d.value === 'prev')?.value;
        if (range) names.forEach((n, i) => { split[range][n] = num(row.metricValues[i]); });
      }

      let series = (daily.rows || [])
        .map((r) => {
          const d = r.dimensionValues[0].value; // YYYYMMDD
          return { date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, users: num(r.metricValues[0]), sessions: num(r.metricValues[1]) };
        })
        .sort((a, b) => (a.date < b.date ? -1 : 1));
      series = fillDays(series, period.start, period.end, { users: 0, sessions: 0 });
      if (needsWeekly(period.days)) series = bucketWeekly(series, { sum: ['users', 'sessions'] });

      return {
        configured: true,
        period,
        totals: split.cur,
        previous: split.prev,
        series,
        channels: splitRanges(channels.rows, 1)
          .map((e) => ({ channel: e.keys[0], sessions: e.cur[0] ?? 0, prevSessions: e.prev[0] ?? 0 }))
          .filter((c) => c.sessions > 0)
          .sort((a, b) => b.sessions - a.sessions)
          .slice(0, 8),
        devices: (devices.rows || []).map((r) => ({ device: r.dimensionValues[0].value, sessions: num(r.metricValues[0]) })),
        pages: splitRanges(landing.rows, 1)
          .map((e) => ({ page: e.keys[0], sessions: e.cur[0] ?? 0, users: e.cur[1] ?? 0, prevSessions: e.prev[0] ?? 0 }))
          .filter((p) => p.sessions > 0)
          .sort((a, b) => b.sessions - a.sessions)
          .slice(0, 50),
        cities: (cities.rows || [])
          .map((r) => ({ city: r.dimensionValues[0].value, users: num(r.metricValues[0]) }))
          .filter((c) => c.city !== '(not set)'),
      };
    });
    return json(data, 200, { 'Cache-Control': 'private, max-age=600' });
  } catch (err) {
    console.error('GA4-fel:', err?.response?.data || err);
    return json({ configured: true, error: googleError(err) });
  }
});
