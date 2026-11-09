// Importerar Google-recensioner (JSON från OpenSEO get_business_reviews) till tabellen reviews.
//
//   node --env-file=.env.local scripts/import-reviews.mjs <recensioner.json>          # skriver till databasen i env
//   node scripts/import-reviews.mjs <recensioner.json> --sql db/reviews-import.sql   # skriver bara en SQL-fil (för Neon-konsolen)
//
// Regler: recensentens egna ord (original_review_text) har företräde framför Googles översättning.
// Publicerad = minst 4 stjärnor och har text. Övriga sparas men visas inte (kan slås på med published = true).
// Körs om utan risk: externt id ger upsert, och manuellt ändrat `published` och `sort_order` skrivs aldrig över.
import fs from 'node:fs';

const args = process.argv.slice(2);
const sqlIdx = args.indexOf('--sql');
const sqlOut = sqlIdx !== -1 ? args[sqlIdx + 1] : null;
const file = args.find((a, i) => !a.startsWith('--') && (sqlIdx === -1 || i !== sqlIdx + 1));
if (!file) {
  console.error('Användning: node scripts/import-reviews.mjs <recensioner.json> [--sql <utfil.sql>]');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const clean = (t) => (t ? String(t).replace(/<br\s*\/?>/gi, '\n').replace(/\s+\n/g, '\n').trim() : '');
const rows = (data.reviews || []).map((r) => {
  const body = clean(r.original_review_text || r.review_text);
  const rating = Number(r.rating && r.rating.value);
  return {
    external_id: r.review_id,
    author: clean(r.profile_name) || 'Anonym',
    body,
    rating: rating >= 1 && rating <= 5 ? rating : 5,
    reviewed_at: r.timestamp ? new Date(r.timestamp.replace(' +00:00', 'Z').replace(' ', 'T')).toISOString() : null,
    owner_reply: clean(r.owner_answer) || null,
    published: rating >= 4 && body.length > 0,
  };
}).filter((r) => r.external_id);

const summary = () => ({
  totalt: rows.length,
  publicerade: rows.filter((r) => r.published).length,
  'sparas men visas inte': rows.filter((r) => !r.published).length,
  'utan text': rows.filter((r) => !r.body).length,
  'under 4 stjärnor': rows.filter((r) => r.rating < 4).length,
});

const lit = (v) => (v === null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const UPDATE_SEEDED = 'update reviews set external_id = $1, reviewed_at = $2, rating = $3, owner_reply = $4 where external_id is null and author = $5';
const UPSERT = `insert into reviews (external_id, author, body, rating, reviewed_at, owner_reply, published, sort_order)
 values ($1, $2, $3, $4, $5, $6, $7, 0)
 on conflict (external_id) do update set author = excluded.author, body = excluded.body, rating = excluded.rating, reviewed_at = excluded.reviewed_at, owner_reply = excluded.owner_reply`;

if (sqlOut) {
  const out = [
    '-- Genererad av scripts/import-reviews.mjs. Additiv och körbar flera gånger.',
    'alter table reviews add column if not exists external_id text;',
    'alter table reviews add column if not exists reviewed_at timestamptz;',
    'alter table reviews add column if not exists owner_reply text;',
    'create unique index if not exists reviews_external_id_key on reviews (external_id);',
  ];
  for (const r of rows) {
    out.push(`update reviews set external_id = ${lit(r.external_id)}, reviewed_at = ${lit(r.reviewed_at)}, rating = ${r.rating}, owner_reply = ${lit(r.owner_reply)} where external_id is null and author = ${lit(r.author)};`);
    out.push(`insert into reviews (external_id, author, body, rating, reviewed_at, owner_reply, published, sort_order) values (${lit(r.external_id)}, ${lit(r.author)}, ${lit(r.body)}, ${r.rating}, ${lit(r.reviewed_at)}, ${lit(r.owner_reply)}, ${r.published}, 0) on conflict (external_id) do update set author = excluded.author, body = excluded.body, rating = excluded.rating, reviewed_at = excluded.reviewed_at, owner_reply = excluded.owner_reply;`);
  }
  fs.writeFileSync(sqlOut, out.join('\n') + '\n');
  console.log('SQL skriven till', sqlOut, summary());
} else {
  const { getPool } = await import('../lib/db.mjs');
  const pool = getPool();
  const before = (await pool.query('select count(*)::int n from reviews')).rows[0].n;
  let matched = 0;
  for (const r of rows) {
    const m = await pool.query(UPDATE_SEEDED, [r.external_id, r.reviewed_at, r.rating, r.owner_reply, r.author]);
    matched += m.rowCount;
    await pool.query(UPSERT, [r.external_id, r.author, r.body, r.rating, r.reviewed_at, r.owner_reply, r.published]);
  }
  const after = (await pool.query('select count(*)::int n, count(*) filter (where published)::int pub from reviews')).rows[0];
  console.log('Importerade', rows.length, 'recensioner.', { 'rader före': before, 'matchade befintliga': matched, 'rader efter': after.n, publicerade: after.pub }, summary());
  await pool.end();
}
