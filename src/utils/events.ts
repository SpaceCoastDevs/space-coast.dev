import { getCollection, type CollectionEntry } from 'astro:content';

export type Event = CollectionEntry<'event'>;

export const getEventPermalink = (event: Event) => `/events/${event.data.slug}`;

export const isSpaceCoastDevsEvent = (event: Event) =>
  event.data.organizer.name === 'Space Coast Devs' || event.data.organizer.url.includes('space-coast-devs');

export const getEventsForMonth = async (month: string): Promise<Event[]> =>
  (await getCollection('event'))
    .filter((event) => event.data.start.startsWith(month))
    .sort((a, b) => a.data.start.localeCompare(b.data.start));

export const getEventsForDateRange = async (start: string, end: string): Promise<Event[]> =>
  (await getCollection('event'))
    .filter((event) => {
      const eventDate = event.data.start.slice(0, 10);
      return eventDate >= start && eventDate < end;
    })
    .sort((a, b) => a.data.start.localeCompare(b.data.start));

export const getAllEvents = async (): Promise<Event[]> =>
  (await getCollection('event')).sort((a, b) => a.data.start.localeCompare(b.data.start));
