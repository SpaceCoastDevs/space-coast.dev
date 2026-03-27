export const prerender = false;

import type { APIRoute } from 'astro';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../lib/firebase';
import { getSession } from '../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  const user = await getSession(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 60) : '';

  if (!name) {
    return new Response(JSON.stringify({ error: 'Skill name is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check for a duplicate (case-insensitive) among approved skills
  const existing = await db.collection('skills').where('approved', '==', true).get();

  const duplicate = existing.docs.some((d) => (d.data().name as string).toLowerCase() === name.toLowerCase());

  if (duplicate) {
    return new Response(JSON.stringify({ error: 'That skill is already in the list' }), {
      status: 409,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.collection('skills').add({
    name,
    category: 'Suggested',
    approved: false,
    submittedBy: user.discordId,
    submittedAt: FieldValue.serverTimestamp(),
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
