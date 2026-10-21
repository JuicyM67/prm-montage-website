import { query } from '../../lib/db.mjs';
import { guarded, json } from '../../lib/guard.mjs';

export const GET = guarded(async () => {
  const { rows } = await query(
    `select a.id, a.created_at, a.action, a.subject, a.meta, u.name as user_name
       from activity_log a left join "user" u on u.id = a.user_id
       order by a.created_at desc limit 200`,
  );
  return json({ activity: rows });
});
