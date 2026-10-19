import { defineConfig } from 'astro/config';

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
});
