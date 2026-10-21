import { auth } from '../lib/auth.mjs';

// Better Auth hanterar allt under /api/auth/* (magic link, session, utloggning).
// Vercel matchar inte kapslade sökvägar (sign-in/magic-link) mot en [...all]-fil för vanliga
// funktioner, så vercel.json skriver om /api/auth/:path* → /api/auth?path=:path*. Här återställs
// den ursprungliga sökvägen innan Better Auth får requesten.
function restore(request) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path');
  if (path === null) return request;
  url.searchParams.delete('path');
  url.pathname = '/api/auth/' + path;
  return new Request(url, request);
}

const handler = (request) => auth.handler(restore(request));

export const GET = handler;
export const POST = handler;
