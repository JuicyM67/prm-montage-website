import { randomBytes } from 'node:crypto';
import { query, logActivity } from '../../lib/db.mjs';
import { guarded, json } from '../../lib/guard.mjs';
import { sendReviewInvite } from '../../lib/emails.mjs';
import { siteOrigin } from '../../lib/google-review.mjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const GET = guarded(async () => {
  const { rows } = await query(
    `select i.id, i.token, i.name, i.email, i.note, i.created_at, i.sent_at, i.opened_at, i.submitted_at, i.review_id,
            u.name as created_by_name
       from review_invites i left join "user" u on u.id = i.created_by
      order by i.created_at desc
      limit 300`,
  );
  return json({ invites: rows });
});

// Skapar en inbjudan och mejlar länken till kunden.
export const POST = guarded(async (request, user) => {
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const note = String(body.note || '').trim().slice(0, 500) || null;
  if (!name || name.length > 120) return json({ error: 'Ange kundens namn.' }, 400);
  if (!EMAIL_RE.test(email) || email.length > 200) return json({ error: 'Ange en giltig e-postadress.' }, 400);

  const token = randomBytes(18).toString('base64url');
  const { rows } = await query(
    'insert into review_invites (token, name, email, note, created_by) values ($1,$2,$3,$4,$5) returning id',
    [token, name, email, note, user.id],
  );
  const id = rows[0].id;
  const url = `${siteOrigin(request)}/omdome?t=${token}`;
  try {
    await sendReviewInvite({ email, name, url });
    await query('update review_invites set sent_at = now() where id = $1', [id]);
  } catch (err) {
    console.error('Omdömesmejl misslyckades:', err);
    return json({ error: 'Inbjudan skapades men mejlet kunde inte skickas. Försök "Skicka om" i listan.', id }, 502);
  }
  await logActivity({ userId: user.id, action: 'review_invite', subject: email, meta: { name } });
  return json({ ok: true, id });
});

// Skickar mejlet igen (samma länk).
export const PUT = guarded(async (request, user) => {
  const { id } = await request.json().catch(() => ({}));
  const { rows } = await query('select token, name, email, submitted_at from review_invites where id = $1', [Number(id)]);
  const inv = rows[0];
  if (!inv) return json({ error: 'Inbjudan hittades inte.' }, 404);
  if (inv.submitted_at) return json({ error: 'Kunden har redan lämnat sitt omdöme.' }, 409);
  await sendReviewInvite({ email: inv.email, name: inv.name, url: `${siteOrigin(request)}/omdome?t=${inv.token}` });
  await query('update review_invites set sent_at = now() where id = $1', [Number(id)]);
  await logActivity({ userId: user.id, action: 'review_invite_resend', subject: inv.email });
  return json({ ok: true });
});

export const DELETE = guarded(async (request, user) => {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!id) return json({ error: 'id saknas.' }, 400);
  await query('delete from review_invites where id = $1', [id]);
  await logActivity({ userId: user.id, action: 'review_invite_delete', subject: String(id) });
  return json({ ok: true });
});
