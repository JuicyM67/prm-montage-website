// Publicerade kundomdömen från databasen (tabellen reviews), hämtade vid bygget så att sidorna förblir statiska.
// Faller tillbaka på de ordagranna recensionerna i reviews.ts om databasen inte svarar, så att bygget aldrig stannar.
import { reviews as staticReviews, type Review } from './reviews';

declare const process: { env: Record<string, string | undefined> };

export interface DbReview extends Review { rating: number; source: string }

// Betyg enligt Googles företagsprofil (hämtat 2026-11-09). Uppdatera när antalet ändras.
export const aggregate = { ratingValue: '4.9', reviewCount: 135 };

const fallback: DbReview[] = staticReviews.map((r) => ({ ...r, rating: 5, source: 'google' }));

let cache: Promise<DbReview[]> | undefined;

async function load(): Promise<DbReview[]> {
  // På Vercel finns DATABASE_URL i process.env; lokalt läser Astro den ur .env.local.
  const url = process.env.DATABASE_URL || (import.meta.env as Record<string, string | undefined>).DATABASE_URL;
  if (!url) return fallback;
  process.env.DATABASE_URL = url;
  try {
    // @ts-ignore – lib/db.mjs är vanlig JS som delas med API-funktionerna
    const { query } = await import('../../lib/db.mjs');
    const result: any = await Promise.race([
      query(
        `select author, body, rating, source, reviewed_at from reviews
          where published = true and rating >= 4
          order by reviewed_at desc nulls last, sort_order, id limit 300`,
      ),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
    ]);
    const rows = result.rows as { author: string; body: string; rating: number; source: string; reviewed_at: Date | null }[];
    if (!rows.length) return fallback;
    console.log(`[db-reviews] ${rows.length} omdömen lästa från databasen`);
    return rows.map((r) => ({
      name: r.author,
      text: r.body,
      rating: r.rating,
      source: r.source,
      date: r.reviewed_at ? new Date(r.reviewed_at).toISOString().slice(0, 10) : undefined,
    }));
  } catch (err) {
    console.warn('[db-reviews] kunde inte läsa omdömen från databasen, använder lokala:', (err as Error).message);
    return fallback;
  }
}

export function getReviews(): Promise<DbReview[]> {
  return (cache ??= load());
}
