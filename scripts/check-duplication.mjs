// Mäter hur stor del av en sidas huvudtext som även finns på andra sidor i samma grupp
// (t.ex. alla "byta-blandare-<område>"). Körs mot en färdig build (dist/).
//
//   npm run build && node scripts/check-duplication.mjs            # gränsen 15 %
//   node scripts/check-duplication.mjs --max 10 --verbose
//
// Metod: huvudinnehållet (kolumnen mellan <div class="col-lg-8"> och <div class="col-lg-4">, alltså utan
// header, footer, sidokolumn och CTA-band) delas i överlappande 6-ordsfraser ("shingles"). Duplicering för en
// sida = andelen av dess fraser som finns på minst en annan sida i gruppen. Exit-kod 1 om någon grupp som
// kontrolleras överskrider gränsen.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const MAX = Number(flag('--max', 15));
const VERBOSE = args.includes('--verbose');
const REPORT_ONLY = args.includes('--report-only'); // visa bara, fail inte (för baslinje på äldre sidor)
const SHINGLE = 6;

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

// Grupper: sidor som är varianter av samma mall och därför riskerar att likna varandra.
// `enforce: false` = bara rapport (för grupper som ännu inte är rättade).
const GROUPS = [
  { name: 'byta blandare × område', test: (s) => /^byta-blandare-.+/.test(s), enforce: true },
  { name: 'handyman × område', test: (s) => /^handyman-(?!stockholm$).+/.test(s), enforce: true },
  { name: 'byta lås × område', test: (s) => /^byta-las-(?!cylinder$).+/.test(s), enforce: true },
  { name: 'köksmontering × ort', test: (s) => /^koksmontering-.+/.test(s), enforce: true },
  { name: 'IKEA-köksmontering × ort', test: (s) => /^ikea-koksmontering-.+/.test(s), enforce: true },
];

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

function mainText(html) {
  const a = html.indexOf('<div class="col-lg-8">');
  const b = html.indexOf('<div class="col-lg-4">', a);
  if (a === -1 || b === -1) return '';
  return decode(
    html
      .slice(a, b)
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' '),
  );
}

const words = (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);

function shingles(ws) {
  const out = [];
  for (let i = 0; i + SHINGLE <= ws.length; i++) out.push(ws.slice(i, i + SHINGLE).join(' '));
  return out;
}

if (!fs.existsSync(dist)) {
  console.error('dist/ saknas — kör npm run build först.');
  process.exit(2);
}
const slugs = fs.readdirSync(dist).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''));

let failed = false;
for (const g of GROUPS) {
  const members = slugs.filter(g.test).sort();
  if (members.length < 2) {
    console.log(`\n${g.name}: ${members.length} sida(or) — hoppar över`);
    continue;
  }
  const data = members.map((slug) => {
    const ws = words(mainText(fs.readFileSync(path.join(dist, slug + '.html'), 'utf8')));
    return { slug, words: ws.length, sh: shingles(ws) };
  });
  // Hur många sidor varje fras förekommer på.
  const df = new Map();
  for (const d of data) for (const s of new Set(d.sh)) df.set(s, (df.get(s) || 0) + 1);

  console.log(`\n${g.name} (${members.length} sidor, gräns ${MAX} %${g.enforce && !REPORT_ONLY ? '' : ', endast rapport'})`);
  let worst = 0;
  for (const d of data) {
    const uniq = new Set(d.sh);
    let dup = 0;
    for (const s of uniq) if (df.get(s) > 1) dup++;
    const pct = uniq.size ? (dup / uniq.size) * 100 : 0;
    worst = Math.max(worst, pct);
    const over = pct > MAX;
    console.log(`  ${over ? '✗' : '✓'} ${d.slug.padEnd(40)} ${pct.toFixed(1).padStart(5)} %   (${d.words} ord)`);
    if (VERBOSE && over) {
      const shared = [...uniq].filter((s) => df.get(s) > 1).slice(0, 5);
      for (const s of shared) console.log(`        "${s}…"`);
    }
  }
  if (worst > MAX && g.enforce && !REPORT_ONLY) failed = true;
}
if (failed) {
  console.error(`\nFör mycket duplicerat innehåll (> ${MAX} %).`);
  process.exit(1);
}
console.log('\nOK');
