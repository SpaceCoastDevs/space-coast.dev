export const prerender = false;

import type { APIRoute } from 'astro';
import { clearTestSessionCookie, publishFacebookTestPost } from '~/lib/facebook-page-test';
import { getSocialAdmin } from '~/lib/social-admin';

export const POST: APIRoute = async ({ request, url }) => {
  const admin = await getSocialAdmin(request);
  if (!admin) return new Response('Not found', { status: 404 });

  const expectedOrigin = url.origin;
  if (request.headers.get('origin') !== expectedOrigin) return new Response('Invalid request origin', { status: 403 });

  const form = await request.formData();
  if (form.get('confirm') !== 'publish-test-post') return new Response('Confirmation required', { status: 400 });

  const headers = new Headers({ 'Set-Cookie': clearTestSessionCookie() });
  try {
    const postId = await publishFacebookTestPost(request, admin.discordId);
    headers.set('Location', `/admin/facebook-test?status=posted&post_id=${encodeURIComponent(postId)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Facebook did not create the test post.';
    headers.set('Location', `/admin/facebook-test?error=${encodeURIComponent(message)}`);
  }

  return new Response(null, { status: 303, headers });
};
