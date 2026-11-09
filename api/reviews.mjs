import { query } from '../lib/db.mjs';

// Publik lista över publicerade kundomdömen (visas i omdömesmodalen). Inga personuppgifter utöver
// det visningsnamn som kunden själv har på sin Google-recension.
export async function GET() {
  try {
    const { rows } = await query(
      'select id, author, body, rating, source from reviews where published = true order by reviewed_at desc nulls last, sort_order, id limit 300',
    );
    return new Response(JSON.stringify({ reviews: rows }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        // CDN-cachas i 5 min; gammal lista får visas medan en ny hämtas.
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('reviews-fel:', err);
    return new Response(JSON.stringify({ reviews: [] }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
