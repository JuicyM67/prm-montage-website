// /assets/* cachas i ett år (immutable, se vercel.json). Filer som byts ut under samma namn (t.ex. logotyper och favicons)
// får därför ett innehållshash i URL:en, så att återkommande besökare hämtar den nya versionen direkt.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const asset = (path: string) => {
  const file = join(process.cwd(), 'public', path.replace(/^\//, ''));
  const hash = createHash('md5').update(readFileSync(file)).digest('hex').slice(0, 8);
  return `${path}?v=${hash}`;
};
