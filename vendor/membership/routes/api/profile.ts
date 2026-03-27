export const prerender = false;

import type { APIRoute } from 'astro';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../../lib/firebase';
import { getSession } from '../../lib/auth';
import { notifyNewMember } from '../../lib/discord-notify';

const ALLOWED_LOOKING_FOR = ['jobs', 'collaborators', 'mentors', 'mentees', 'open-source'];
const MAX_SKILLS = 50;
const MAX_FIELD_LENGTH = 200;
const MAX_BIO_LENGTH = 1024;

function sanitize(val: unknown, maxLen = MAX_FIELD_LENGTH): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function sanitizeUrl(val: unknown): string {
  const s = sanitize(val);
  if (!s) return '';
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
    return u.toString();
  } catch {
    return '';
  }
}

export const POST: APIRoute = async ({ request }) => {
  const user = await getSession(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!user.emailVerified) {
    return new Response(JSON.stringify({ error: 'Email verification required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const form = await request.formData();

  const skills = (form.getAll('skills') as string[])
    .flatMap((s) => s.split(','))
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_SKILLS);

  const lookingFor = (form.getAll('lookingFor') as string[]).filter((v) => ALLOWED_LOOKING_FOR.includes(v));

  const updates = {
    displayName: sanitize(form.get('displayName')) || user.displayName,
    bio: sanitize(form.get('bio'), MAX_BIO_LENGTH),
    location: sanitize(form.get('location')),
    website: sanitizeUrl(form.get('website')),
    github: sanitize(form.get('github')),
    linkedin: sanitize(form.get('linkedin')),
    bluesky: sanitize(form.get('bluesky')),
    skills,
    lookingFor,
    isPublic: form.get('isPublic') !== 'false',
    updatedAt: FieldValue.serverTimestamp(),
  };

  const docRef = db.collection('members').doc(user.discordId);
  const existing = await docRef.get();
  const shouldAnnounce = existing.data()?.announced === false && updates.isPublic;

  await docRef.update(shouldAnnounce ? { ...updates, announced: true } : updates);

  if (shouldAnnounce) {
    const d = existing.data() ?? {};
    notifyNewMember({
      discordId: user.discordId,
      displayName: updates.displayName,
      avatarUrl: user.avatarUrl,
      bio: updates.bio || d.bio,
      location: updates.location || d.location,
      skills: updates.skills.length ? updates.skills : d.skills,
    });
  }

  return new Response(null, {
    status: 302,
    headers: { Location: '/profile?status=saved' },
  });
};
