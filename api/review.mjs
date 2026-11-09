import { query } from '../lib/db.mjs';
import { GOOGLE_REVIEW_URL } from '../lib/google-review.mjs';

const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store' };
const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers });

async function findInvite(token) {
  if (!token || typeof token !== 'string' || token.length < 10 || token.length > 64) return null;
  const { rows } = await query('select id, name, submitted_at from review_invites where token = $1', [token]);
  return rows[0] || null;
}

// Kundens inbjudan: visar namn och om omdömet redan är inskickat.
export async function GET(request) {
  try {
    const token = new URL(request.url).searchParams.get('t');
    const inv = await findInvite(token);
    if (!inv) return reply({ error: 'Länken är ogiltig eller har gått ut.' }, 404);
    await query('update review_invites set opened_at = coalesce(opened_at, now()) where id = $1', [inv.id]);
    return reply({ name: inv.name, submitted: Boolean(inv.submitted_at), googleUrl: GOOGLE_REVIEW_URL });
  } catch (err) {
    console.error('review GET-fel:', err);
    return reply({ error: 'Något gick fel.' }, 500);
  }
}

// Sparar omdömet (ej publicerat förrän det godkänns i admin) och stänger länken.
export async function POST(request) {
  try {
    const b = await request.json().catch(() => ({}));
    const inv = await findInvite(b.t);
    if (!inv) return reply({ error: 'Länken är ogiltig eller har gått ut.' }, 404);
    if (inv.submitted_at) return reply({ error: 'Du har redan lämnat ett omdöme. Tack!' }, 409);

    const rating = Number(b.rating);
    const text = String(b.body || '').trim();
    const author = String(b.author || '').trim().slice(0, 80) || inv.name;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return reply({ error: 'Välj ett betyg.' }, 400);
    if (text.length < 5 || text.length > 2000) return reply({ error: 'Skriv några rader om din upplevelse.' }, 400);

    const { rows } = await query(
      "insert into reviews (author, body, rating, source, published, reviewed_at) values ($1,$2,$3,'website',false,now()) returning id",
      [author, text, rating],
    );
    await query('update review_invites set submitted_at = now(), review_id = $2 where id = $1', [inv.id, rows[0].id]);
    return reply({ ok: true, googleUrl: GOOGLE_REVIEW_URL });
  } catch (err) {
    console.error('review POST-fel:', err);
    return reply({ error: 'Något gick fel.' }, 500);
  }
}
