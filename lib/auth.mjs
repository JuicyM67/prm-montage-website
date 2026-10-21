import { betterAuth } from 'better-auth';
import { magicLink, admin } from 'better-auth/plugins';
import { getPool, query } from './db.mjs';
import { sendLoginLink, sendInvite } from './emails.mjs';

// Sätts av api/admin/users.mjs strax före en inbjudan, så att samma magic link-flöde skickar
// ett välkomstmejl. Hålls i minnet (inte i requesten) så att ingen utifrån kan förfalska det.
export const inviteContext = new Map();

const baseURL = process.env.BETTER_AUTH_URL || 'https://prmmontage.se';

// Magic link är enda inloggningssättet och sign-up är avstängt: bara användare som en admin
// redan skapat (inbjudan) kan få en länk. Better Auth anropar sendMagicLink även för okända
// adresser, så vi kontrollerar själva — annars kunde vem som helst få oss att mejla främlingar.
export const auth = betterAuth({
  baseURL,
  basePath: '/api/auth',
  secret: process.env.BETTER_AUTH_SECRET,
  database: getPool(),
  trustedOrigins: ['https://prmmontage.se', 'https://www.prmmontage.se', 'http://localhost:3000', 'http://localhost:4321'],
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  advanced: { cookiePrefix: 'prm-admin' },
  plugins: [
    magicLink({
      disableSignUp: true,
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        const { rows } = await query('select banned from "user" where lower(email) = lower($1)', [email]);
        if (!rows.length || rows[0].banned) return;
        const invite = inviteContext.get(email.toLowerCase());
        if (invite) {
          inviteContext.delete(email.toLowerCase());
          await sendInvite({ email, name: invite.name, invitedBy: invite.invitedBy, url });
        } else {
          await sendLoginLink({ email, url });
        }
      },
    }),
    admin({ defaultRole: 'member', adminRoles: ['admin'] }),
  ],
});

// Hämtar inloggad användare ur en Web-standard Request, eller null.
export async function getSessionUser(request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}
