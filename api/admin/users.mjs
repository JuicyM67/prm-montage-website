import { randomUUID } from 'node:crypto';
import { auth, inviteContext } from '../../lib/auth.mjs';
import { query, logActivity } from '../../lib/db.mjs';
import { guarded, json } from '../../lib/guard.mjs';

const ROLES = ['admin', 'member'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const GET = guarded(async () => {
  const { rows } = await query(
    `select u.id, u.name, u.email, u.role, coalesce(u.banned, false) as banned, u."createdAt" as created_at,
            (select max(s."createdAt") from session s where s."userId" = u.id) as last_login
       from "user" u order by u."createdAt" asc`,
  );
  return json({ users: rows });
});

// Bjud in: skapar användaren och skickar en magic link med välkomstmejl.
export const POST = guarded(async (request, me) => {
  const { email, name, role = 'member' } = await request.json().catch(() => ({}));
  const lower = String(email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(lower)) return json({ error: 'Ogiltig e-postadress.' }, 400);
  if (!name || !String(name).trim()) return json({ error: 'Namn krävs.' }, 400);
  if (!ROLES.includes(role)) return json({ error: 'Ogiltig roll.' }, 400);

  const exists = await query('select 1 from "user" where lower(email) = $1', [lower]);
  if (exists.rows.length) return json({ error: 'Det finns redan en användare med den adressen.' }, 409);

  await query(
    `insert into "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
     values ($1, $2, $3, true, $4, now(), now())`,
    [randomUUID(), String(name).trim(), lower, role],
  );

  inviteContext.set(lower, { name: String(name).trim(), invitedBy: me.name });
  try {
    await auth.api.signInMagicLink({ body: { email: lower, callbackURL: '/admin' }, headers: request.headers });
  } catch (err) {
    inviteContext.delete(lower);
    console.error('Kunde inte skicka inbjudan:', err);
    return json({ error: 'Användaren skapades men mejlet kunde inte skickas. Skicka om inbjudan från listan.' }, 502);
  }

  await logActivity({ userId: me.id, action: 'user.invited', subject: String(name).trim(), meta: { email: lower, role } });
  return json({ ok: true }, 201);
}, { role: 'admin' });

// Skicka om inbjudan/inloggningslänk till en befintlig användare.
export const PUT = guarded(async (request, me) => {
  const { id } = await request.json().catch(() => ({}));
  const { rows } = await query('select email, name from "user" where id = $1', [id]);
  if (!rows.length) return json({ error: 'Hittade inte användaren.' }, 404);
  const email = rows[0].email.toLowerCase();
  inviteContext.set(email, { name: rows[0].name, invitedBy: me.name });
  try {
    await auth.api.signInMagicLink({ body: { email, callbackURL: '/admin' }, headers: request.headers });
  } catch (err) {
    inviteContext.delete(email);
    console.error('Kunde inte skicka om inbjudan:', err);
    return json({ error: 'Mejlet kunde inte skickas.' }, 502);
  }
  await logActivity({ userId: me.id, action: 'user.reinvited', subject: rows[0].name, meta: { email } });
  return json({ ok: true });
}, { role: 'admin' });

export const DELETE = guarded(async (request, me) => {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return json({ error: 'id saknas.' }, 400);
  if (id === me.id) return json({ error: 'Du kan inte ta bort dig själv.' }, 400);
  const { rows } = await query('delete from "user" where id = $1 returning name, email', [id]);
  if (!rows.length) return json({ error: 'Hittade inte användaren.' }, 404);
  await logActivity({ userId: me.id, action: 'user.removed', subject: rows[0].name, meta: { email: rows[0].email } });
  return json({ ok: true });
}, { role: 'admin' });
