import { query, logActivity } from '../../lib/db.mjs';
import { guarded, json } from '../../lib/guard.mjs';

// Omdömen som kunder skrivit via inbjudningslänken (source = 'website'). Publiceras först när någon godkänner dem.
export const GET = guarded(async () => {
  const { rows } = await query(
    `select id, author, body, rating, published, created_at
       from reviews where source = 'website'
      order by published asc, created_at desc limit 200`,
  );
  return json({ reviews: rows });
});

export const PATCH = guarded(async (request, user) => {
  const { id, published } = await request.json().catch(() => ({}));
  if (!Number.isInteger(id) || typeof published !== 'boolean') return json({ error: 'Ogiltig begäran.' }, 400);
  await query("update reviews set published = $2 where id = $1 and source = 'website'", [id, published]);
  await logActivity({ userId: user.id, action: published ? 'review_publish' : 'review_hide', subject: String(id) });
  return json({ ok: true });
});
