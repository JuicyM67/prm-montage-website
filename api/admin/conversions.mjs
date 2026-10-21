import { query } from '../../lib/db.mjs';
import { guarded, json } from '../../lib/guard.mjs';
import { bucketWeekly, needsWeekly, resolvePeriod } from '../../lib/period.mjs';

// Leads från sajten = samtalsklick + mejlklick (click_events) + formulär (leads).
// Dygn räknas i svensk tid. $1–$4 = start/slut för perioden och för jämförelseperioden (inklusive slutdagen).
const WITH = `
  with p as (
    select $1::date as cur_start, ($2::date + 1) as cur_end, $3::date as prev_start, ($4::date + 1) as prev_end
  ),
  ev as (
    select kind as k, created_at at time zone 'Europe/Stockholm' as ts, page, placement as detail from click_events
    union all
    select 'form', created_at at time zone 'Europe/Stockholm', page, type from leads
  )`;

const KEYS = { phone: 'phone', email: 'email', form: 'forms' };
const empty = () => ({ phone: 0, email: 0, forms: 0 });

export const GET = guarded(async (request) => {
  const period = resolvePeriod(new URL(request.url).searchParams.get('period'), { lagDays: 0 });
  if (period.empty) return json({ period, empty: true });

  const params = [period.start, period.end, period.prevStart, period.prevEnd];
  const q = (sql) => query(WITH + sql, params).then((r) => r.rows);
  const IN_PERIOD = 'ts >= cur_start and ts < cur_end';

  const [totals, daily, placements, pages, formTypes, since] = await Promise.all([
    q(`select k, count(*) filter (where ${IN_PERIOD})::int as cur,
              count(*) filter (where ts >= prev_start and ts < prev_end)::int as prev
         from ev, p where ts >= prev_start and ts < cur_end group by k`),
    q(`select to_char(date_trunc('day', ts), 'YYYY-MM-DD') as d, k, count(*)::int as n
         from ev, p where ${IN_PERIOD} group by 1, 2`),
    q(`select k, detail, count(*)::int as n from ev, p
        where ${IN_PERIOD} and k in ('phone', 'email') group by 1, 2 order by n desc`),
    q(`select coalesce(page, '(okänd sida)') as page,
              count(*) filter (where k = 'phone')::int as phone,
              count(*) filter (where k = 'email')::int as email,
              count(*) filter (where k = 'form')::int as forms,
              count(*)::int as total
         from ev, p where ${IN_PERIOD} group by 1 order by total desc, page limit 8`),
    q(`select detail as type, count(*)::int as n from ev, p where k = 'form' and ${IN_PERIOD} group by 1 order by n desc`),
    query('select min(created_at) as since from click_events').then((r) => r.rows),
  ]);

  const cur = empty();
  const prev = empty();
  for (const row of totals) {
    cur[KEYS[row.k]] = row.cur;
    prev[KEYS[row.k]] = row.prev;
  }

  // En rad per dygn i perioden, även dagar utan händelser.
  const byDay = new Map();
  for (const row of daily) {
    const entry = byDay.get(row.d) ?? empty();
    entry[KEYS[row.k]] = row.n;
    byDay.set(row.d, entry);
  }
  let series = [];
  const start = new Date(period.start + 'T00:00:00Z');
  for (let i = 0; i < period.days; i += 1) {
    const d = new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    series.push({ date: d, ...(byDay.get(d) ?? empty()) });
  }
  if (needsWeekly(period.days)) series = bucketWeekly(series, { sum: ['phone', 'email', 'forms'] });

  return json({
    period,
    totals: { ...cur, total: cur.phone + cur.email + cur.forms },
    previous: { ...prev, total: prev.phone + prev.email + prev.forms },
    daily: series,
    placements: placements.map((r) => ({ kind: r.k, placement: r.detail, count: r.n })),
    pages,
    formTypes,
    // Klickmätningen startade när första händelsen sparades; formulär finns sedan lanseringen av admin.
    trackingSince: since[0]?.since ?? null,
  });
});
