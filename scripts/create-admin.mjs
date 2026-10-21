// Skapar den allra första administratören direkt i databasen (inbjudningsflödet kräver
// redan en inloggad admin). Användning:
//   node --env-file=.env.local scripts/create-admin.mjs "namn@exempel.se" "Förnamn Efternamn"
import { randomUUID } from 'node:crypto';
import { getPool } from '../lib/db.mjs';

const [email, name] = process.argv.slice(2);
if (!email || !name) {
  console.error('Användning: node --env-file=.env.local scripts/create-admin.mjs <e-post> "<namn>"');
  process.exit(1);
}

const pool = getPool();
const lower = email.trim().toLowerCase();
const { rows } = await pool.query('select id, role from "user" where email = $1', [lower]);
if (rows.length) {
  await pool.query('update "user" set role = \'admin\', "emailVerified" = true, "updatedAt" = now() where id = $1', [rows[0].id]);
  console.log(`Befintlig användare ${lower} är nu admin.`);
} else {
  await pool.query(
    `insert into "user" (id, name, email, "emailVerified", role, "createdAt", "updatedAt")
     values ($1, $2, $3, true, 'admin', now(), now())`,
    [randomUUID(), name.trim(), lower],
  );
  console.log(`Skapade admin ${lower}.`);
}
await pool.end();
