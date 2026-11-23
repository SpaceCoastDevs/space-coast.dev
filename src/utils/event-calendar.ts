import { createHash } from 'node:crypto';
import identityOverrides from '../data/event-calendar-identities.json';

export interface CalendarIdentity {
  sourceUrl: string;
  sourceIdentity?: { provider: 'meetup' | 'eventbrite' | 'luma'; id: string };
  calendarId?: string;
}

const getProviderIdentity = ({ sourceUrl, sourceIdentity }: CalendarIdentity): string | undefined => {
  if (sourceIdentity) return JSON.stringify([sourceIdentity.provider, sourceIdentity.id]);
  const url = new URL(sourceUrl);
  const host = url.hostname.replace(/^www\./, '');
  const meetupId = host === 'meetup.com' && url.pathname.match(/\/events\/([^/]+)/)?.[1];
  if (meetupId) return JSON.stringify(['meetup', meetupId]);
  const eventbriteId = host === 'eventbrite.com' && url.pathname.match(/\/e\/(?:.*-)?(\d+)\/?$/)?.[1];
  if (eventbriteId) return JSON.stringify(['eventbrite', eventbriteId]);
  const lumaId = (host === 'luma.com' || host === 'lu.ma') && url.pathname.match(/^\/([^/]+)\/?$/)?.[1];
  if (lumaId) return JSON.stringify(['luma', lumaId]);
};

/** Occurrence ID, independent of title, date, URL slug, and tracking parameters. */
export const getCalendarIdentity = (data: CalendarIdentity): string => {
  if (data.calendarId) return JSON.stringify(['local', data.calendarId]);
  const providerIdentity = getProviderIdentity(data);
  if (providerIdentity) return providerIdentity;
  throw new Error(`Event needs an immutable calendarId: ${data.sourceUrl}`);
};

// Protowork's Dec 16 mirror. Meetup 316189328 remains the canonical feed entry.
// Match the provider identity, not an importer-owned file or a presentation slug.
const excludedFromAggregateFeed = JSON.stringify(['eventbrite', '2004500909179']);
export const isInAggregateCalendarFeed = (data: CalendarIdentity): boolean =>
  getProviderIdentity(data) !== excludedFromAggregateFeed;

/** Shared by feed and individual downloads. Never use start/date/title/slug as identity. */
export const getEventCalendarUid = (event: { id: string; data: CalendarIdentity }): string => {
  const calendarId = (identityOverrides as Record<string, string>)[event.id] ?? event.data.calendarId;
  return `${createHash('sha256')
    .update(getCalendarIdentity({ ...event.data, calendarId }))
    .digest('base64url')}@space-coast.dev`;
};
