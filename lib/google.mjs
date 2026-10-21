import { GoogleAuth } from 'google-auth-library';

// En tjänstekonto (GOOGLE_SERVICE_ACCOUNT_JSON) läser både Search Console och GA4.
// Kontots e-postadress måste läggas till som användare i respektive tjänst.
let client;
export function googleConfigured() {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
}

async function getClient() {
  if (!client) {
    const auth = new GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      scopes: [
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/analytics.readonly',
      ],
    });
    client = await auth.getClient();
  }
  return client;
}

export async function googlePost(url, data) {
  const c = await getClient();
  const res = await c.request({ url, method: 'POST', data });
  return res.data;
}

// Små minnescachar per funktionsinstans — Googles data uppdateras ändå bara någon gång per dygn.
const cache = new Map();
export async function cached(key, ttlMs, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  const value = await fn();
  cache.set(key, { at: Date.now(), value });
  return value;
}

export const isoDay = (d) => d.toISOString().slice(0, 10);
export function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

export function googleError(err) {
  const msg = err?.response?.data?.error?.message || err?.message || 'Okänt fel';
  return `Google svarade med fel: ${msg}`;
}
