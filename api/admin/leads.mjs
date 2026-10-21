import { query, logActivity } from '../../lib/db.mjs';
import { guarded, json } from '../../lib/guard.mjs';

const STATUSES = ['ny', 'hanterad', 'arkiverad'];

export const GET = guarded(async (request) => {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const params = [];
  let where = '';
  if (status && STATUSES.includes(status)) {
    params.push(status);
    where = 'where l.status = $1';
  }
  const { rows } = await query(
    `select l.id, l.created_at, l.type, l.name, l.email, l.phone, l.service, l.message, l.address,
            l.postal_code, l.city, l.area, l.page, l.attachments, l.status, l.notes, l.handled_at,
            u.name as handled_by_name
       from leads l left join "user" u on u.id = l.handled_by
       ${where}
       order by l.created_at desc
       limit 500`,
    params,
  );
  return json({ leads: rows });
});

export const PATCH = guarded(async (request, user) => {
  const { id, status, notes } = await request.json().catch(() => ({}));
  if (!id || typeof id !== 'string') return json({ error: 'id saknas.' }, 400);
  if (status !== undefined && !STATUSES.includes(status)) return json({ error: 'Ogiltig status.' }, 400);
  if (notes !== undefined && (typeof notes !== 'string' || notes.length > 5000)) return json({ error: 'Ogiltig anteckning.' }, 400);

  const sets = [];
  const params = [id];
  if (status !== undefined) {
    params.push(status);
    sets.push(`status = $${params.length}`);
    // Spara vem som hanterade leadet; återställs till "ny" nollas det.
    if (status === 'ny') sets.push('handled_by = null', 'handled_at = null');
    else {
      params.push(user.id);
      sets.push(`handled_by = $${params.length}`, 'handled_at = now()');
    }
  }
  if (notes !== undefined) {
    params.push(notes);
    sets.push(`notes = $${params.length}`);
  }
  if (!sets.length) return json({ error: 'Inget att uppdatera.' }, 400);

  const { rows } = await query(`update leads set ${sets.join(', ')} where id = $1 returning id, name, status`, params);
  if (!rows.length) return json({ error: 'Hittade inte förfrågan.' }, 404);
  if (status !== undefined) {
    await logActivity({ userId: user.id, action: 'lead.status', subject: rows[0].name, meta: { id, status } });
  }
  return json({ ok: true });
});
