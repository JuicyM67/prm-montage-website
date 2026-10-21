import { query } from '../../lib/db.mjs';
import { guarded, json } from '../../lib/guard.mjs';

export const GET = guarded(async () => {
  const [counts, recent, users] = await Promise.all([
    query(`select
        count(*) filter (where created_at > now() - interval '7 days')::int as leads_7d,
        count(*) filter (where status = 'ny')::int as leads_new,
        count(*)::int as leads_total
      from leads`),
    query(`select a.id, a.created_at, a.action, a.subject, u.name as user_name
      from activity_log a left join "user" u on u.id = a.user_id
      order by a.created_at desc limit 6`),
    query(`select
        count(*) filter (where not coalesce(banned, false))::int as users,
        count(*) filter (where not coalesce(banned, false) and not exists (select 1 from session s where s."userId" = "user".id))::int as pending_invites
      from "user"`),
  ]);
  const { rows: oldest } = await query(
    `select count(*)::int as n from leads where status = 'ny' and created_at < now() - interval '2 days'`,
  );
  return json({
    leads7d: counts.rows[0].leads_7d,
    leadsNew: counts.rows[0].leads_new,
    leadsTotal: counts.rows[0].leads_total,
    leadsStale: oldest[0].n,
    users: users.rows[0].users,
    pendingInvites: users.rows[0].pending_invites,
    recent: recent.rows,
  });
});
