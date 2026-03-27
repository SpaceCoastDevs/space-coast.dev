/**
 * Manually send Discord new-member announcements for members who were missed.
 *
 * Targets members where:
 *   - emailVerified === true
 *   - isPublic     === true
 *   - announced    !== true  (false OR missing field)
 *
 * Usage:
 *   npm run announce:missed          # dry run — lists affected members, sends nothing
 *   npm run announce:missed -- --send  # sends notifications and marks announced: true
 */

import 'dotenv/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const WEBHOOK_URL = process.env.DISCORD_NOTIFY_WEBHOOK_URL;
const DRY_RUN = !process.argv.includes('--send');

interface Member {
  discordId: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  location?: string;
  skills?: string[];
  announced?: boolean;
}

async function sendWebhook(member: Member): Promise<void> {
  if (!WEBHOOK_URL) throw new Error('DISCORD_NOTIFY_WEBHOOK_URL is not set');

  const profileUrl = `https://space-coast.dev/members/${member.discordId}`;
  const bio = member.bio?.trim();
  const bioExcerpt = bio ? bio.slice(0, 200) + (bio.length > 200 ? '…' : '') : null;

  const fields: { name: string; value: string; inline?: boolean }[] = [];
  if (member.location) fields.push({ name: 'Location', value: member.location, inline: true });
  if (member.skills?.length) {
    const shown = member.skills.slice(0, 8).join(', ');
    const overflow = member.skills.length > 8 ? ` +${member.skills.length - 8} more` : '';
    fields.push({ name: 'Skills', value: shown + overflow });
  }

  const body = {
    embeds: [
      {
        author: { name: member.displayName, icon_url: member.avatarUrl, url: profileUrl },
        title: 'New member profile on Space Coast Devs',
        url: profileUrl,
        description: bioExcerpt ?? undefined,
        color: 0x5865f2,
        fields,
        footer: { text: 'space-coast.dev/members' },
      },
    ],
  };

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Discord webhook returned ${res.status}`);
}

async function run() {
  console.log(DRY_RUN ? '🔍 DRY RUN — pass --send to actually send\n' : '🚀 SENDING announcements\n');

  const snap = await db.collection('members').where('emailVerified', '==', true).where('isPublic', '==', true).get();

  const missed = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Member) })).filter((m) => m.announced !== true);

  if (missed.length === 0) {
    console.log('✓ No missed announcements found.');
    return;
  }

  console.log(`Found ${missed.length} member(s) without announcements:\n`);
  for (const m of missed) {
    console.log(`  • ${m.displayName} (${m.discordId})`);
  }

  if (DRY_RUN) {
    console.log('\nRun with --send to announce these members.');
    return;
  }

  if (!WEBHOOK_URL) {
    console.error('\n✗ DISCORD_NOTIFY_WEBHOOK_URL is not set in .env');
    process.exit(1);
  }

  console.log('');
  let sent = 0;
  for (const m of missed) {
    try {
      await sendWebhook(m);
      await db.collection('members').doc(m.discordId).update({ announced: true });
      console.log(`  ✓ Announced: ${m.displayName}`);
      sent++;
    } catch (err: unknown) {
      console.error(`  ✗ Failed: ${m.displayName} —`, err instanceof Error ? err.message : err);
    }
    // Respect Discord rate limit (~5 req / 2s per webhook)
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nDone. ${sent}/${missed.length} announcements sent.`);
}

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
