export const prerender = false;

import type { APIRoute } from 'astro';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { db } from '../../../lib/firebase';
import { getSession } from '../../../lib/auth';
import { sendVerificationEmail } from '../../../lib/email';

export const POST: APIRoute = async ({ request }) => {
  const user = await getSession(request);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let email: string;
  try {
    const body = await request.json();
    email = (body.email ?? '').trim().toLowerCase();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  // Already verified
  const memberDoc = await db.collection('members').doc(user.discordId).get();
  if (memberDoc.data()?.emailVerified === true) {
    return Response.json({ error: 'Email already verified.' }, { status: 400 });
  }

  // Rate limit: one code per 60 seconds
  const verRef = db.collection('verifications').doc(user.discordId);
  const existing = await verRef.get();
  if (existing.exists) {
    const createdAt = existing.data()?.createdAt as Timestamp | undefined;
    if (createdAt && Date.now() - createdAt.toMillis() < 60_000) {
      return Response.json({ error: 'Please wait 60 seconds before requesting a new code.' }, { status: 429 });
    }
  }

  // 6-digit code (100000–999999)
  const code = String((crypto.getRandomValues(new Uint32Array(1))[0] % 900000) + 100000);
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000));

  await verRef.set({
    email,
    code,
    expiresAt,
    attempts: 0,
    createdAt: FieldValue.serverTimestamp(),
  });

  try {
    await sendVerificationEmail(email, code);
  } catch (err) {
    // Clean up the verification doc so a retry doesn't hit the rate limit
    await verRef.delete();
    console.error('[send-verification] Email send failed:', (err as Error).message);
    return Response.json(
      { error: 'Failed to send verification email. Please check your email address and try again.' },
      { status: 500 }
    );
  }

  return Response.json({ ok: true });
};
