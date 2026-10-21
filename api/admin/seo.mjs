import { guarded, json } from '../../lib/guard.mjs';
import { cached, daysAgo, googleConfigured, googleError, googlePost, isoDay } from '../../lib/google.mjs';

// Search Console släpar ~2 dagar efter, så perioden slutar för 2 dagar sedan.
export const GET = guarded(async () => {
  const site = process.env.GSC_SITE_URL;
  if (!googleConfigured() || !site) return json({ configured: false });

  try {
    const data = await cached('seo', 60 * 60 * 1000, async () => {
      const base = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`;
      const cur = { startDate: isoDay(daysAgo(29)), endDate: isoDay(daysAgo(2)) };
      const prev = { startDate: isoDay(daysAgo(57)), endDate: isoDay(daysAgo(30)) };
      const [totals, prevTotals, queries, pages] = await Promise.all([
        googlePost(base, { ...cur }),
        googlePost(base, { ...prev }),
        googlePost(base, { ...cur, dimensions: ['query'], rowLimit: 50 }),
        googlePost(base, { ...cur, dimensions: ['page'], rowLimit: 25 }),
      ]);
      const pick = (r) => ({ clicks: r?.clicks ?? 0, impressions: r?.impressions ?? 0, ctr: r?.ctr ?? 0, position: r?.position ?? 0 });
      const rows = (res, key) => (res.rows || []).map((r) => ({ [key]: r.keys[0], ...pick(r) }));
      return {
        configured: true,
        period: cur,
        totals: pick(totals.rows?.[0]),
        previous: pick(prevTotals.rows?.[0]),
        queries: rows(queries, 'query'),
        pages: rows(pages, 'page'),
      };
    });
    return json(data, 200, { 'Cache-Control': 'private, max-age=600' });
  } catch (err) {
    console.error('Search Console-fel:', err?.response?.data || err);
    return json({ configured: true, error: googleError(err) });
  }
});
