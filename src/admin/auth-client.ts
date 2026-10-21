import { createAuthClient } from 'better-auth/react';
import { magicLinkClient, adminClient } from 'better-auth/client/plugins';

// Samma origin som sajten → /api/auth (api/auth/[...all].mjs). Cookien är first-party.
export const authClient = createAuthClient({
  plugins: [magicLinkClient(), adminClient()],
});
