import { query } from '../../lib/db.mjs';
import { guarded, json } from '../../lib/guard.mjs';

// Leads från sajten = samtalsklick + mejlklick (click_events) + formulär (leads).
// Dygn räknas i svensk tid. $1 = antal dagar; "prev" är lika lång period närmast före.
const WITH = `
  with p as (
    select date_trunc('day', now() at time zone 'Europe/Stockholm') - ($1::int - 1) * interval '1 day' as cur_start,
           date_trunc('day', now() at time zone 'Europe/Stockholm') - (2 * $1::int - 1) * interval '1 day' as prev_start
  ),
  ev as (
    select kind as k, created_at at time zone 'Europe/Stockholm' as ts, page, placement as detail from click_events
    union all
    select 'form', created_at at time zone 'Europe/Stockholm', page, type from leads
  )`;

const ALLOWED_DAYS = [7, 28, 90];
const KEYS = { phone: 'phone', email: 'email', form: 'forms' };

export const GET = guarded(async (request) => {
  const requested = Number(new URL(request.url).searchParams.get('days'));
  const days = ALLOWED_DAYS.includes(requested) ? requested : 28;
  const q = (sql) => query(WITH + sql, [days]).then((r) => r.rows);

  const [range, totals, daily, placements, pages, formTypes, since] = await Promise.all([
    q(`select to_char(cur_start, 'YYYY-MM-DD') as start from p`),
    q(`select k, count(*) filter (where ts >= cur_start)::int as cur, count(*) filter (where ts < cur_start)::int as prev
         from ev, p where ts >= prev_start group by k`),
    q(`select to_char(date_trunc('day', ts), 'YYYY-MM-DD') as d, k, count(*)::int as n
         from ev, p where ts >= cur_start group by 1, 2`),
    q(`select k, detail, count(*)::int as n from ev, p
        where ts >= cur_start and k in ('phone', 'email') group by 1, 2 order by n desc`),
    q(`select coalesce(page, '(okänd sida)') as page,
              count(*) filter (where k = 'phone')::int as phone,
              count(*) filter (where k = 'email')::int as email,
              count(*) filter (where k = 'form')::int as forms,
              count(*)::int as total
         from ev, p where ts >= cur_start group by 1 order by total desc, page limit 8`),
    q(`select detail as type, count(*)::int as n from ev, p where k = 'form' and ts >= cur_start group by 1 order by n desc`),
    query('select min(created_at) as since from click_events').then((r) => r.rows),
  ]);

  const cur = { phone: 0, email: 0, forms: 0 };
  const prev = { phone: 0, email: 0, forms: 0 };
  for (const row of totals) {
    cur[KEYS[row.k]] = row.cur;
    prev[KEYS[row.k]] = row.prev;
  }

  // En rad per dygn i perioden, även dagar utan händelser.
  const byDay = new Map();
  for (const row of daily) {
    const entry = byDay.get(row.d) ?? { phone: 0, email: 0, forms: 0 };
    entry[KEYS[row.k]] = row.n;
    byDay.set(row.d, entry);
  }
  const series = [];
  const start = new Date(range[0].start + 'T00:00:00Z');
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10);
    series.push({ date: d, ...(byDay.get(d) ?? { phone: 0, email: 0, forms: 0 }) });
  }

  return json({
    days,
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
