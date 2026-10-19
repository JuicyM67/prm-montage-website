import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

// Bygget misslyckas om public/sitemap.xml och sidorna i src/pages glidit isär —
// en ny sida utan sitemap-rad (eller tvärtom) ska inte kunna nå produktion.
function sitemapGuard() {
  return {
    name: 'sitemap-guard',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const out = fileURLToPath(dir);
        const pages = fs.readdirSync(out).filter((f) => f.endsWith('.html') && f !== '404.html')
          .map((f) => (f === 'index.html' ? '/' : '/' + f.replace(/\.html$/, '')));
        const xml = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8');
        const listed = [...xml.matchAll(/<loc>https:\/\/prmmontage\.se([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
        const missing = pages.filter((p) => !listed.includes(p));
        const stale = listed.filter((p) => !pages.includes(p));
        if (missing.length || stale.length) {
          throw new Error(`sitemap.xml stämmer inte med sidorna.\n  Saknas i sitemap: ${missing.join(', ') || '-'}\n  Finns i sitemap men saknar sida: ${stale.join(', ') || '-'}`);
        }
      },
    },
  };
}

// Ren statisk build till dist/ — /api/* ligger kvar som vanliga Vercel-funktioner i api/.
// build.format "file" ger kontakt.html (inte kontakt/index.html) så att Vercels cleanUrls
// serverar samma URL:er som den gamla sajten (/kontakt, utan snedstreck på slutet).
export default defineConfig({
  site: 'https://prmmontage.se',
  trailingSlash: 'never',
  build: { format: 'file' },
  // Behåll HTML:en identisk med den handskrivna — whitespace kan påverka inline-layouten.
  compressHTML: false,
  devToolbar: { enabled: false },
  integrations: [sitemapGuard()],
});
