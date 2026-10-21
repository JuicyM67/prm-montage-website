import { guarded, json } from '../../lib/guard.mjs';
import { cached, googleConfigured, googleError, googlePost } from '../../lib/google.mjs';

export const GET = guarded(async () => {
  const property = process.env.GA4_PROPERTY_ID;
  if (!googleConfigured() || !property) return json({ configured: false });

  try {
    const data = await cached('analytics', 30 * 60 * 1000, async () => {
      const url = `https://analyticsdata.googleapis.com/v1beta/properties/${property}:runReport`;
      const dateRanges = [
        { startDate: '28daysAgo', endDate: 'yesterday', name: 'cur' },
        { startDate: '56daysAgo', endDate: '29daysAgo', name: 'prev' },
      ];
      const [totals, channels, landing] = await Promise.all([
        googlePost(url, {
          dateRanges,
          metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }, { name: 'keyEvents' }],
        }),
        googlePost(url, {
          dateRanges: [dateRanges[0]],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 8,
        }),
        googlePost(url, {
          dateRanges: [dateRanges[0]],
          dimensions: [{ name: 'landingPage' }],
          metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'keyEvents' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 15,
        }),
      ]);

      const names = ['users', 'sessions', 'pageViews', 'keyEvents'];
      const split = { cur: {}, prev: {} };
      for (const row of totals.rows || []) {
        const range = row.dimensionValues?.find((d) => d.value === 'cur' || d.value === 'prev')?.value;
        if (!range) continue;
        names.forEach((n, i) => { split[range][n] = Number(row.metricValues[i].value); });
      }
      return {
        configured: true,
        totals: split.cur,
        previous: split.prev,
        channels: (channels.rows || []).map((r) => ({ channel: r.dimensionValues[0].value, sessions: Number(r.metricValues[0].value) })),
        landing: (landing.rows || []).map((r) => ({
          page: r.dimensionValues[0].value,
          sessions: Number(r.metricValues[0].value),
          users: Number(r.metricValues[1].value),
          keyEvents: Number(r.metricValues[2].value),
        })),
      };
    });
    return json(data, 200, { 'Cache-Control': 'private, max-age=600' });
  } catch (err) {
    console.error('GA4-fel:', err?.response?.data || err);
    return json({ configured: true, error: googleError(err) });
  }
});
