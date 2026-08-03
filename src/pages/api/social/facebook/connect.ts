export const prerender = false;

import type { APIRoute } from 'astro';
import { beginFacebookAuthorization } from '~/lib/facebook-page-test';
import { getSocialAdmin } from '~/lib/social-admin';

export const GET: APIRoute = async ({ request }) => {
  const admin = await getSocialAdmin(request);
  if (!admin) return new Response('Not found', { status: 404 });

  try {
    const authorization = beginFacebookAuthorization(admin.discordId);
    return new Response(null, {
      status: 302,
      headers: { Location: authorization.location, 'Set-Cookie': authorization.cookie },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Facebook authorization could not be started.';
    return new Response(null, {
      status: 302,
      headers: { Location: `/admin/facebook-test?error=${encodeURIComponent(message)}` },
    });
  }
};
