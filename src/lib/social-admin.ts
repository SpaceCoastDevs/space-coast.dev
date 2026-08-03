import { getSession, type SessionUser } from '~/lib/auth';

export async function getSocialAdmin(request: Request): Promise<SessionUser | null> {
  const user = await getSession(request);
  const adminDiscordId = import.meta.env.SOCIAL_ADMIN_DISCORD_ID;

  if (!user || !adminDiscordId || user.discordId !== adminDiscordId) return null;
  return user;
}
