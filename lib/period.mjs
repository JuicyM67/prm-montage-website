// Gemensam periodlogik för Översikt, Sökord & ranking och Besökare. Alla datum är
// YYYY-MM-DD i svensk tid. Varje period har en jämförelseperiod (prev) av samma längd.
const TZ = 'Europe/Stockholm';
const DAY = 86_400_000;

export const PERIODS = {
  '7d': 'Senaste 7 dagarna',
  '28d': 'Senaste 28 dagarna',
  '90d': 'Senaste 90 dagarna',
  month: 'Den här månaden',
  lastmonth: 'Förra månaden',
  year: 'Det här året',
};
export const DEFAULT_PERIOD = '28d';

const toDate = (s) => new Date(s + 'T00:00:00Z');
const fmt = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => fmt(new Date(toDate(s).getTime() + n * DAY));
const diffDays = (a, b) => Math.round((toDate(b).getTime() - toDate(a).getTime()) / DAY);
const minDate = (a, b) => (a < b ? a : b);

function addMonths(s, n) {
  const d = toDate(s);
  return fmt(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1)));
}
const lastOfMonth = (firstOfMonth) => addDays(addMonths(firstOfMonth, 1), -1);

export const todayInStockholm = (now = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: TZ }).format(now);

// lagDays: hur många dygn data släpar (Search Console ≈ 2, GA4 ≈ 1, egen databas 0).
// Slutdatumet kapas därefter; blir perioden tom (t.ex. den 1:a–2:a i månaden) returneras empty: true.
export function resolvePeriod(id, { lagDays = 0, now = new Date() } = {}) {
  const key = Object.hasOwn(PERIODS, id) ? id : DEFAULT_PERIOD;
  const today = todayInStockholm(now);
  const lastAvailable = addDays(today, -lagDays);
  let start;
  let end;
  let prevStart;
  let prevEnd;

  if (/^\d+d$/.test(key)) {
    const n = parseInt(key, 10);
    end = lastAvailable;
    start = addDays(end, -(n - 1));
    prevEnd = addDays(start, -1);
    prevStart = addDays(prevEnd, -(n - 1));
  } else if (key === 'month') {
    start = today.slice(0, 8) + '01';
    end = lastAvailable;
    if (end >= start) {
      // Samma antal dagar av förra månaden, så att "den 10:e" jämförs med "den 10:e".
      prevStart = addMonths(start, -1);
      prevEnd = minDate(addDays(prevStart, diffDays(start, end)), lastOfMonth(prevStart));
    }
  } else if (key === 'lastmonth') {
    start = addMonths(today.slice(0, 8) + '01', -1);
    end = minDate(lastOfMonth(start), lastAvailable);
    if (end >= start) {
      prevStart = addMonths(start, -1);
      // Hel månad jämförs med hela månaden före; kapas den av datalagret används lika många dagar.
      prevEnd = end === lastOfMonth(start) ? lastOfMonth(prevStart) : minDate(addDays(prevStart, diffDays(start, end)), lastOfMonth(prevStart));
    }
  } else {
    // year
    start = today.slice(0, 4) + '-01-01';
    end = lastAvailable;
    if (end >= start) {
      const year = Number(today.slice(0, 4));
      prevStart = `${year - 1}-01-01`;
      prevEnd = minDate(addDays(prevStart, diffDays(start, end)), `${year - 1}-12-31`);
    }
  }

  const empty = end < start;
  return {
    id: key,
    label: PERIODS[key],
    start,
    end,
    prevStart: empty ? null : prevStart,
    prevEnd: empty ? null : prevEnd,
    days: empty ? 0 : diffDays(start, end) + 1,
    empty,
  };
}

// Google levererar bara dagar med data. Fyll i saknade dagar med nollor så att diagrammen får rätt tidsaxel.
export function fillDays(series, start, end, zero = {}) {
  const byDate = new Map(series.map((row) => [row.date, row]));
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(byDate.get(d) ?? { date: d, ...zero });
  return out;
}

// Långa perioder (> 92 dagar) blir veckostaplar/veckopunkter i diagram. `sum` summeras,
// `weighted` är medelvärden viktade med ett annat fält (t.ex. position viktad med visningar).
export const needsWeekly = (days) => days > 92;

export function bucketWeekly(series, { sum = [], weighted = {} } = {}) {
  const weeks = new Map();
  for (const row of series) {
    const d = toDate(row.date);
    const monday = fmt(new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY));
    const bucket = weeks.get(monday) ?? { date: monday, _w: {} };
    for (const k of sum) bucket[k] = (bucket[k] ?? 0) + (row[k] ?? 0);
    for (const [field, weightField] of Object.entries(weighted)) {
      const w = row[weightField] ?? 0;
      bucket._w[field] = bucket._w[field] ?? { num: 0, den: 0 };
      bucket._w[field].num += (row[field] ?? 0) * w;
      bucket._w[field].den += w;
    }
    weeks.set(monday, bucket);
  }
  return [...weeks.values()]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map(({ _w, ...rest }) => {
      for (const [field, { num, den }] of Object.entries(_w)) rest[field] = den ? num / den : 0;
      return rest;
    });
}
