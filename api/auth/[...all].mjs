import { auth } from '../../lib/auth.mjs';

// Better Auth hanterar allt under /api/auth/* (magic link, session, utloggning).
const handler = (request) => auth.handler(request);

export const GET = handler;
export const POST = handler;
