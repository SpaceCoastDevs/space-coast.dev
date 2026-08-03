export const prerender = false;

import type { APIRoute } from 'astro';
import { clearFacebookStateCookie, createFacebookTestSession, testSessionCookie } from '~/lib/facebook-page-test';
import { getSocialAdmin } from '~/lib/social-admin';

export const GET: APIRoute = async ({ request, url }) => {
  const admin = await getSocialAdmin(request);
  if (!admin) return new Response('Not found', { status: 404 });

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const errorDescription = url.searchParams.get('error_description');
  const headers = new Headers({ 'Set-Cookie': clearFacebookStateCookie() });

  try {
    if (!code || !state) throw new Error(errorDescription ?? 'Facebook authorization was cancelled.');
    const sessionId = await createFacebookTestSession(request, admin.discordId, state, code);
    headers.append('Set-Cookie', testSessionCookie(sessionId));
    headers.set('Location', '/admin/facebook-test?status=connected');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Facebook authorization failed.';
    headers.set('Location', `/admin/facebook-test?error=${encodeURIComponent(message)}`);
  }

  return new Response(null, { status: 302, headers });
};
