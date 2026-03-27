export const prerender = false;

import type { APIRoute } from 'astro';
import { clearSessionCookies } from '~/lib/auth';

export const GET: APIRoute = async () => {
  const headers = new Headers({ Location: '/' });
  clearSessionCookies().forEach((c) => headers.append('Set-Cookie', c));
  return new Response(null, { status: 302, headers });
};
