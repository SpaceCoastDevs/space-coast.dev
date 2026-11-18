import { createHash } from 'node:crypto';
import identityOverrides from '../data/event-calendar-identities.json';

export interface CalendarIdentity {
  sourceUrl: string;
  calendarId?: string;
}

/** Provider occurrence ID, independent of title, date, URL slug, and tracking parameters. */
export const getCalendarIdentity = ({ sourceUrl, calendarId }: CalendarIdentity): string => {
  if (calendarId) return JSON.stringify(['local', calendarId]);
  const url = new URL(sourceUrl);
  const host = url.hostname.replace(/^www\./, '');
  const meetupId = host === 'meetup.com' && url.pathname.match(/\/events\/([^/]+)/)?.[1];
  if (meetupId) return JSON.stringify(['meetup', meetupId]);
  const eventbriteId = host === 'eventbrite.com' && url.pathname.match(/\/e\/(?:.*-)?(\d+)\/?$/)?.[1];
  if (eventbriteId) return JSON.stringify(['eventbrite', eventbriteId]);
  const lumaId = (host === 'luma.com' || host === 'lu.ma') && url.pathname.match(/^\/([^/]+)\/?$/)?.[1];
  if (lumaId) return JSON.stringify(['luma', lumaId]);
  throw new Error(`Event needs an immutable calendarId: ${sourceUrl}`);
};

/** Shared by feed and individual downloads. Never use start/date/title/slug as identity. */
export const getEventCalendarUid = (event: { id: string; data: CalendarIdentity }): string => {
  const calendarId = (identityOverrides as Record<string, string>)[event.id] ?? event.data.calendarId;
  return `${createHash('sha256')
    .update(getCalendarIdentity({ ...event.data, calendarId }))
    .digest('base64url')}@space-coast.dev`;
};
