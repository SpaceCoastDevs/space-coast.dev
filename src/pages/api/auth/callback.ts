export const prerender = false;

import type { APIRoute } from 'astro';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '~/lib/firebase';
import { exchangeCodeForToken, getDiscordUser, getAvatarUrl, isGuildMember } from '~/lib/discord';
import { createSession, buildSessionCookies } from '~/lib/auth';

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const GET: APIRoute = async ({ request, url }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const cookieHeader = request.headers.get('cookie');
  const storedState = parseCookie(cookieHeader, 'oauth_state');

  // CSRF check
  if (!code || !state || state !== storedState) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/members?error=invalid_state' },
    });
  }

  try {
    const accessToken = await exchangeCodeForToken(code);
    const discordUser = await getDiscordUser(accessToken);

    const guildId = import.meta.env.DISCORD_GUILD_ID;
    const inGuild = await isGuildMember(accessToken, guildId);
    if (!inGuild) {
      return new Response(null, {
        status: 302,
        headers: { Location: '/members?error=not_member' },
      });
    }

    const avatarUrl = getAvatarUrl(discordUser);
    const displayName = discordUser.global_name ?? discordUser.username;
    const docRef = db.collection('members').doc(discordUser.id);
    const doc = await docRef.get();

    // Read emailVerified before upserting (new members default to false)
    const emailVerified: boolean = doc.exists ? (doc.data()?.emailVerified ?? false) : false;

    if (!doc.exists) {
      await docRef.set({
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        displayName,
        avatarUrl,
        bio: '',
        location: '',
        website: '',
        github: '',
        linkedin: '',
        bluesky: '',
        skills: [],
        lookingFor: [],
        isPublic: true,
        emailVerified: false,
        email: '',
        joinedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await docRef.update({
        discordUsername: discordUser.username,
        avatarUrl,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const sessionUser = { discordId: discordUser.id, discordUsername: discordUser.username, displayName, avatarUrl, emailVerified };
    const token = await createSession(sessionUser);
    const cookieHeaders = buildSessionCookies(token, sessionUser);

    const redirectTo = emailVerified ? '/profile' : '/verify-email';
    const headers = new Headers({ Location: redirectTo });
    // Clear the state cookie and set session cookies
    headers.append('Set-Cookie', 'oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
    cookieHeaders.forEach((c) => headers.append('Set-Cookie', c));

    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error('Auth callback error:', err);
    return new Response(null, {
      status: 302,
      headers: { Location: '/members?error=auth_failed' },
    });
  }
};
