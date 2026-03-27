export const prerender = false;

import type { APIRoute } from 'astro';
import { getOAuthUrl } from '../../../lib/discord';

export const GET: APIRoute = async () => {
  const state = crypto.randomUUID();

  const headers = new Headers({
    Location: getOAuthUrl(state),
  });

  // Short-lived state cookie for CSRF protection (10 minute expiry)
  headers.append('Set-Cookie', `oauth_state=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax`);

  return new Response(null, { status: 302, headers });
};
