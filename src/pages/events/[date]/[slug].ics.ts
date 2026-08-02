import type { APIRoute, GetStaticPaths } from 'astro';
import { getAllEvents } from '~/utils/events';

export const prerender = true;

export const getStaticPaths = (async () => {
  const events = await getAllEvents();
  return events.map((event) => ({
    params: { date: event.data.start.slice(0, 10), slug: event.data.slug },
    props: { event },
  }));
}) satisfies GetStaticPaths;

const escapeIcs = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const formatIcsDate = (value: string) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

export const GET: APIRoute = ({ props }) => {
  const { event } = props;
  const { data } = event;
  const location = data.location
    ? [data.location.name, data.location.address, data.location.city, data.location.region].filter(Boolean).join(', ')
    : '';
  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Space Coast Devs//Events//EN',
    'BEGIN:VEVENT',
    `UID:${data.slug}@space-coast.dev`,
    `DTSTAMP:${formatIcsDate(new Date().toISOString())}`,
    `DTSTART:${formatIcsDate(data.start)}`,
    ...(data.end ? [`DTEND:${formatIcsDate(data.end)}`] : []),
    `SUMMARY:${escapeIcs(data.title)}`,
    `DESCRIPTION:${escapeIcs(`${data.description}\n\nMore details: ${data.sourceUrl}`)}`,
    ...(location ? [`LOCATION:${escapeIcs(location)}`] : []),
    `URL:${data.sourceUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');

  return new Response(calendar, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${data.slug}.ics"`,
    },
  });
};
