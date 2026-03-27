export const prerender = false;

import type { APIRoute } from 'astro';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '~/lib/firebase';
import { getSession, createSession, buildSessionCookies } from '~/lib/auth';

export const POST: APIRoute = async ({ request }) => {
  const user = await getSession(request);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let code: string;
  try {
    const body = await request.json();
    code = (body.code ?? '').trim();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!code) {
    return Response.json({ error: 'Verification code is required.' }, { status: 400 });
  }

  const verRef = db.collection('verifications').doc(user.discordId);
  const verDoc = await verRef.get();

  if (!verDoc.exists) {
    return Response.json({ error: 'No verification in progress. Please request a new code.' }, { status: 400 });
  }

  const ver = verDoc.data()!;

  // Check expiry
  if ((ver.expiresAt as Timestamp).toMillis() < Timestamp.now().toMillis()) {
    await verRef.delete();
    return Response.json({ error: 'This code has expired. Please request a new one.' }, { status: 400 });
  }

  // Check attempts limit
  if ((ver.attempts as number) >= 5) {
    await verRef.delete();
    return Response.json({ error: 'Too many incorrect attempts. Please request a new code.' }, { status: 400 });
  }

  // Check the code
  if (ver.code !== code) {
    await verRef.update({ attempts: FieldValue.increment(1) });
    const remaining = 4 - (ver.attempts as number);
    return Response.json(
      { error: `Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` },
      { status: 400 }
    );
  }

  // Code correct — activate the member
  await db
    .collection('members')
    .doc(user.discordId)
    .update({
      email: ver.email as string,
      emailVerified: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
  await verRef.delete();

  // Re-issue the JWT with emailVerified: true
  const updatedUser = { ...user, emailVerified: true };
  const token = await createSession(updatedUser);
  const cookies = buildSessionCookies(token, updatedUser);

  const headers = new Headers();
  cookies.forEach((c) => headers.append('Set-Cookie', c));
  return Response.json({ ok: true }, { headers });
};
