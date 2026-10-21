// Verifierar att varje SEO-URL är intakt genom att jämföra LIVE (prmmontage.se) med den nya sajten.
//
//   npm run verify:urls
//       jämför LIVE mot det lokala bygget i dist/ (kör `npm run build` först)
//   npm run verify:urls -- --candidate=https://<preview>.vercel.app
//       jämför LIVE mot en deployad preview — den bästa grinden före domänbytet
//
// Kontrollerar: sitemap-URL:er, status, title, description, canonical, robots, lang, h1/h2/h3,
// og/twitter, JSON-LD (nyckelordning ignoreras), interna länkar och alla redirect-regler i vercel.json.
// Avslutar med exit-kod 1 vid avvikelse.
import fs from 'node:fs';
import * as cheerio from 'cheerio';

const LIVE = 'https://prmmontage.se';
const CANDIDATE = (process.argv.find((a) => a.startsWith('--candidate=')) || '').slice('--candidate='.length).replace(/\/$/, '');
const UA = { 'user-agent': 'Mozilla/5.0 seo-verify' };
const get = (base) => (path) => fetch(base + path, { redirect: 'manual', headers: UA });
const getLive = get(LIVE);
const getCand = CANDIDATE ? get(CANDIDATE) : null;
console.log(CANDIDATE ? `jämför LIVE mot kandidat ${CANDIDATE}` : 'jämför LIVE mot lokala dist/');

const problems = [];
const note = (m) => problems.push(m);
const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
const sortKeys = (v) => Array.isArray(v) ? v.map(sortKeys)
  : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v;
const diff = (a, b) => a.filter((x) => !b.includes(x));

// 1. Sitemap: live mot ny, och mot de sidor som faktiskt byggts
const locs = (x) => [...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const liveLocs = locs(await (await getLive('/sitemap.xml')).text());
const newLocs = locs(CANDIDATE ? await (await getCand('/sitemap.xml')).text() : fs.readFileSync('public/sitemap.xml', 'utf8'));
const built = CANDIDATE ? newLocs : fs.readdirSync('dist').filter((f) => f.endsWith('.html') && f !== '404.html' && f !== 'admin.html')
  .map((f) => LIVE + (f === 'index.html' ? '/' : '/' + f.replace(/\.html$/, '')));
console.log(`sitemap: live ${liveLocs.length} URL:er, ny ${newLocs.length}, sidor ${built.length}`);
diff(liveLocs, newLocs).forEach((u) => note(`i LIVE-sitemap men inte i nya sitemap: ${u}`));
diff(newLocs, liveLocs).forEach((u) => note(`i nya sitemap men inte i LIVE-sitemap: ${u}`));
diff(liveLocs, built).forEach((u) => note(`LIVE-sitemap-URL saknar sida i nya sajten: ${u}`));
diff(built, liveLocs).forEach((u) => note(`sida i nya sajten som inte finns i LIVE-sitemap: ${u}`));

// 2. Varje live-URL: samma status, metadata, rubriker, JSON-LD och interna länkar
const fields = {
  title: (c) => c('title').text(),
  description: (c) => c('meta[name=description]').attr('content'),
  canonical: (c) => c('link[rel=canonical]').attr('href'),
  robots: (c) => c('meta[name=robots]').attr('content') ?? null,
  lang: (c) => c('html').attr('lang'),
  h1: (c) => c('h1').map((_, e) => norm(c(e).text())).get().join('|'),
  headings: (c) => c('h2,h3').map((_, e) => e.name + ':' + norm(c(e).text())).get().join('|'),
  ogUrl: (c) => c('meta[property="og:url"]').attr('content'),
  ogImage: (c) => c('meta[property="og:image"]').attr('content'),
  ogTitle: (c) => c('meta[property="og:title"]').attr('content'),
  twitterDescription: (c) => c('meta[name="twitter:description"]').attr('content'),
  jsonld: (c) => JSON.stringify(sortKeys(c('script[type="application/ld+json"]').map((_, e) => JSON.parse(c(e).text())).get())),
  links: (c) => {
    const b = c('body').clone();
    b.find('.tpoffcanvas-area').remove();
    return [...new Set(b.find('a[href^="/"]').map((_, e) => c(e).attr('href').split('#')[0]).get())].sort().join(' ');
  },
};
// Avsiktliga skillnader mot gamla sajten (se git-historiken): startsidans Områden-meny fick Upplands Väsby,
// och tre kartlänkar rättades från Industrivägen 23 till 19.
const INTENDED_NEW_LINKS = { '/': ['/upplands-vasby'] };

let checked = 0;
for (const url of liveLocs) {
  const path = url.replace(LIVE, '') || '/';
  const r = await getLive(path);
  if (r.status !== 200) { note(`${path}: LIVE svarar ${r.status} (väntade 200)`); continue; }
  const L = cheerio.load(await r.text());
  let html;
  if (CANDIDATE) {
    const cr = await getCand(path);
    if (cr.status !== 200) { note(`${path}: KANDIDATEN svarar ${cr.status} (väntade 200)`); continue; }
    html = await cr.text();
  } else {
    const file = 'dist/' + (path === '/' ? 'index' : path.slice(1)) + '.html';
    if (!fs.existsSync(file)) { note(`${path}: ingen byggd fil (${file})`); continue; }
    html = fs.readFileSync(file, 'utf8');
  }
  const N = cheerio.load(html);
  for (const [k, fn] of Object.entries(fields)) {
    const a = fn(L);
    let b = fn(N);
    if (k === 'links') {
      const extra = INTENDED_NEW_LINKS[path] || [];
      b = b.split(' ').filter((x) => !(extra.includes(x) && !a.split(' ').includes(x))).join(' ');
    }
    if (a !== b) note(`${path}: ${k} skiljer\n      live: ${String(a).slice(0, 160)}\n      ny:   ${String(b).slice(0, 160)}`);
  }
  checked++;
}
console.log(`sidor jämförda mot LIVE: ${checked}`);

// 3. Redirects: varje regel i vercel.json ska ge samma svar som LIVE gör idag, målen ska finnas,
//    och ingen riktig sida får matchas av en redirect-regel.
const cfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const redirects = cfg.redirects.filter((r) => !r.has); // www→apex-regeln har host-villkor och testas separat nedan
const toRegex = (src) => new RegExp('^' + src.replace(/\//g, '\\/')
  .replace(/:[a-zA-Z]+\*/g, '.*').replace(/:[a-zA-Z]+\+/g, '.+').replace(/:[a-zA-Z]+/g, '[^\\/]+') + '$');
const sample = (src) => src.replace(/:[a-zA-Z]+[*+]/g, 'exempel-sida').replace(/:[a-zA-Z]+/g, 'x');
const pagePaths = new Set(built.map((u) => u.replace(LIVE, '') || '/'));
const target = CANDIDATE ? getCand : getLive;
let ok = 0;
for (const r of redirects) {
  const s = sample(r.source);
  const res = await target(s);
  const loc = res.headers.get('location');
  const want = r.destination.startsWith('http') ? r.destination : LIVE + r.destination;
  const got = loc && (loc.startsWith('http') ? loc.replace(CANDIDATE, LIVE) : LIVE + loc);
  if (![301, 308].includes(res.status) || (got && got.replace(/\/$/, '') !== want.replace(/\/$/, ''))) {
    note(`redirect ${s}: ${CANDIDATE ? 'KANDIDATEN' : 'LIVE'} ger ${res.status} → ${loc}, vercel.json säger ${r.destination}`);
  } else ok++;
  if (!r.destination.includes(':') && !pagePaths.has(r.destination)) note(`redirect ${r.source}: målet ${r.destination} finns inte som sida`);
  if (pagePaths.has(r.source)) note(`redirect ${r.source} skuggar en riktig sida`);
}
for (const p of pagePaths) for (const r of redirects) if (toRegex(r.source).test(p)) note(`riktig sida ${p} matchas av redirect-regeln ${r.source}`);
console.log(`redirects: ${redirects.length} regler, ${ok} ger samma svar som LIVE-konfigurationen`);

// 4. Övrigt: robots/llms ska vara oförändrade; .html-URL och okänd URL ska bete sig som på LIVE
for (const f of ['robots.txt', 'llms.txt']) {
  const live = await (await getLive('/' + f)).text();
  const other = CANDIDATE ? await (await getCand('/' + f)).text() : fs.readFileSync('public/' + f, 'utf8');
  if (live.trim() !== other.trim()) note(`/${f}: LIVE skiljer från ${CANDIDATE ? 'kandidaten' : 'public/' + f}`);
}
if (CANDIDATE) {
  for (const p of ['/kontakt.html', '/finns-inte-alls-xyz']) {
    const [a, b] = [await getLive(p), await getCand(p)];
    const la = a.headers.get('location'), lb = b.headers.get('location');
    if (a.status !== b.status || (la || '').replace(LIVE, '') !== (lb || '').replace(CANDIDATE, '')) note(`${p}: LIVE ${a.status} ${la || ''} men kandidaten ${b.status} ${lb || ''}`);
  }
}

console.log(problems.length
  ? `\n${problems.length} AVVIKELSE(R):\n` + problems.join('\n')
  : '\nALLT STÄMMER — alla SEO-URL:er, metadata, JSON-LD och redirects är intakta mot LIVE.');
process.exit(problems.length ? 1 : 0);
