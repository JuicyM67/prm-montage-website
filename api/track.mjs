import { query } from '../lib/db.mjs';

// Anonym räkning av klick på telefonnummer och mejladress (skickas från cookie-consent.js).
// Inga cookies, ingen IP/user-agent/ID sparas — bara typ, sida och placering.
const KINDS = ['phone', 'email'];
const PLACEMENTS = ['header', 'footer', 'menu', 'mobile_bar', 'modal', 'page'];
const ALLOWED_HOSTS = ['prmmontage.se', 'www.prmmontage.se', 'localhost'];
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|monitor|preview|curl|wget|python|axios|node-fetch/i;
const PAGE_RE = /^\/[A-Za-z0-9\-._~%/]{0,199}$/;

// Enkel spärr mot översvämning, per funktionsinstans. IP:n används bara som nyckel i minnet.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 30;
}

const done = () => new Response(null, { status: 204 });

// Svarar alltid 204 — mätningen får aldrig påverka sidan, och vi läcker inget om varför något avvisas.
export async function POST(request) {
  try {
    const source = request.headers.get('origin') || request.headers.get('referer') || '';
    let host = '';
    try { host = new URL(source).hostname; } catch { /* tom */ }
    if (!ALLOWED_HOSTS.includes(host)) return done();
    if (BOT_RE.test(request.headers.get('user-agent') || '')) return done();
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
    if (rateLimited(ip)) return done();

    const { kind, page, placement } = await request.json();
    if (!KINDS.includes(kind) || !PLACEMENTS.includes(placement)) return done();
    if (typeof page !== 'string' || !PAGE_RE.test(page)) return done();

    await query('insert into click_events (kind, page, placement) values ($1, $2, $3)', [kind, page, placement]);
  } catch (err) {
    console.error('track-fel:', err);
  }
  return done();
}
