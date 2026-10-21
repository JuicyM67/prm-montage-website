import { getSessionUser } from './auth.mjs';

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', ...headers },
  });
}

// Kör handlern bara för inloggade (och ej avstängda) användare. role: 'admin' kräver adminroll.
// Sessionen kontrolleras alltid här på servern — de statiska admin-sidorna är bara skal.
export function guarded(handler, { role } = {}) {
  return async (request) => {
    let user;
    try {
      user = await getSessionUser(request);
    } catch (err) {
      console.error('Sessionsfel:', err);
      return json({ error: 'Kunde inte verifiera sessionen.' }, 500);
    }
    if (!user || user.banned) return json({ error: 'Inte inloggad.' }, 401);
    if (role === 'admin' && user.role !== 'admin') return json({ error: 'Kräver administratör.' }, 403);
    try {
      return await handler(request, user);
    } catch (err) {
      console.error('Admin-API-fel:', err);
      return json({ error: 'Något gick fel.' }, 500);
    }
  };
}
