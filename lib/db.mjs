import { Pool } from '@neondatabase/serverless';

// Ett pool per funktionsinstans. Neons pooler (pgbouncer) sköter anslutningarna.
let pool;
export function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}

export async function logActivity({ userId = null, action, subject = null, meta = {} }) {
  try {
    await query(
      'insert into activity_log (user_id, action, subject, meta) values ($1, $2, $3, $4)',
      [userId, action, subject, JSON.stringify(meta)],
    );
  } catch (err) {
    console.error('activity_log-fel:', err);
  }
}
