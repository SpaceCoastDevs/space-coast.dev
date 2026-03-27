const WEBHOOK_URL = import.meta.env.DISCORD_NOTIFY_WEBHOOK_URL as string | undefined;

export interface MemberNotifyPayload {
  discordId: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  location?: string;
  skills?: string[];
}

export async function notifyNewMember(member: MemberNotifyPayload): Promise<void> {
  if (!WEBHOOK_URL) return;

  const profileUrl = `https://spacecoast.dev/members/${member.discordId}`;
  const bioExcerpt = member.bio ? member.bio.slice(0, 200) + (member.bio.length > 200 ? '…' : '') : null;

  const fields: { name: string; value: string; inline?: boolean }[] = [];
  if (member.location) fields.push({ name: 'Location', value: member.location, inline: true });
  if (member.skills?.length) {
    const shown = member.skills.slice(0, 8).join(', ');
    const overflow = member.skills.length > 8 ? ` +${member.skills.length - 8} more` : '';
    fields.push({ name: 'Skills', value: shown + overflow, inline: false });
  }

  const body = {
    embeds: [
      {
        author: {
          name: member.displayName,
          icon_url: member.avatarUrl,
          url: profileUrl,
        },
        title: 'New member profile on Space Coast Devs',
        url: profileUrl,
        description: bioExcerpt ?? undefined,
        color: 0x5865f2, // Discord blurple
        fields,
        footer: { text: 'spacecoast.dev/members' },
      },
    ],
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error('[discord-notify] webhook returned', res.status);
    }
  } catch (err: unknown) {
    console.error('[discord-notify]', err instanceof Error ? err.message : err);
  }
}
