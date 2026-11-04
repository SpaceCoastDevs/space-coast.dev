import { getCollection, type CollectionEntry } from 'astro:content';

export type Event = CollectionEntry<'event'>;

export const getEventDate = (event: Event) => event.data.start.slice(0, 10);

const eventDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const getCalendarDate = (date: Date): string => {
  const parts = eventDateFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};

export const getEventDates = (event: Event): string[] => {
  const startDate = getCalendarDate(new Date(event.data.start));
  // Subtract one millisecond so a local-midnight end excludes that calendar day.
  let endDate = event.data.end
    ? getCalendarDate(new Date(new Date(event.data.end).getTime() - 1))
    : startDate;

  if (endDate < startDate) endDate = startDate;

  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  while (cursor.toISOString().slice(0, 10) <= endDate) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
};

export const eventOccursOnDate = (event: Event, date: string) => getEventDates(event).includes(date);

export const getEventPermalink = (event: Event) => `/events/${getEventDate(event)}/${event.data.slug}`;

export const getEventAnchorId = (event: Event) => `event-${getEventDate(event)}-${event.data.slug}`;

export const isSpaceCoastDevsEvent = (event: Event) =>
  event.data.organizer.name === 'Space Coast Devs' || event.data.organizer.url.includes('space-coast-devs');

export const isFeaturedEvent = (event: Event) => event.data.featured === true;

export const getEventCostLabel = (event: Event) => {
  const cost = event.data.cost;
  if (!cost) return undefined;
  if (cost.type === 'free') return 'Free';
  if (typeof cost.amount !== 'number') return 'Paid';

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: cost.currency || 'USD',
    maximumFractionDigits: 2,
  });
  const minimum = formatter.format(cost.amount);

  return typeof cost.maximumAmount === 'number' && cost.maximumAmount > cost.amount
    ? `${minimum}–${formatter.format(cost.maximumAmount)}`
    : minimum;
};

export const getEventsForMonth = async (month: string): Promise<Event[]> => {
  const monthStart = `${month}-01`;
  const nextMonth = new Date(`${monthStart}T00:00:00Z`);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  return getEventsForDateRange(monthStart, nextMonth.toISOString().slice(0, 10));
};

export const getEventsForDateRange = async (start: string, end: string): Promise<Event[]> =>
  (await getCollection('event'))
    .filter((event) => {
      const eventDates = getEventDates(event);
      return eventDates[0] < end && eventDates[eventDates.length - 1] >= start;
    })
    .sort((a, b) => a.data.start.localeCompare(b.data.start));

export const getAllEvents = async (): Promise<Event[]> =>
  (await getCollection('event')).sort((a, b) => a.data.start.localeCompare(b.data.start));
