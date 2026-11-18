import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { getEventCalendarUid as eventUid } from '../src/utils/event-calendar';

const getEventCalendarUid = (data: { sourceUrl: string; calendarId?: string }) => eventUid({ id: 'test', data });

const root = new URL('../src/content/event/', import.meta.url);
const paths = readdirSync(root).flatMap((group) =>
  readdirSync(new URL(`${group}/`, root))
    .filter((file) => file.endsWith('.json'))
    .map((file) => join(group, file))
);
const events = paths.map((path) => JSON.parse(readFileSync(new URL(path, root), 'utf8')));
const meetup = (date: string) =>
  events.find((event) => event.slug === 'space-coast-devs-monthly-meetup' && event.start.startsWith(date));

test('November 18 and December 16 occurrences have distinct UIDs', () => {
  assert.ok(meetup('2026-11-18'));
  assert.ok(meetup('2026-12-16'));
  assert.notEqual(getEventCalendarUid(meetup('2026-11-18')), getEventCalendarUid(meetup('2026-12-16')));
});

test('rescheduling, renaming, and changing URL presentation do not change provider identity', () => {
  const event = meetup('2026-11-18');
  const rescheduled = { ...event, start: '2026-11-19T18:00:00-05:00', title: 'New title', slug: 'new-slug' };
  assert.equal(getEventCalendarUid(event), getEventCalendarUid(rescheduled));
  assert.equal(
    getEventCalendarUid({ sourceUrl: 'https://www.eventbrite.com/e/old-title-tickets-123?ref=old' }),
    getEventCalendarUid({ sourceUrl: 'https://eventbrite.com/e/new-title-tickets-123/' })
  );
});

test('same ID across providers is not the same calendar event', () => {
  assert.notEqual(
    getEventCalendarUid({ sourceUrl: 'https://www.meetup.com/group/events/123/' }),
    getEventCalendarUid({ sourceUrl: 'https://www.eventbrite.com/e/title-tickets-123' })
  );
});

test('explicit IDs survive file/date/title/URL changes and distinguish ambiguous listings', () => {
  const event = { ...events[0], calendarId: 'unchanged-record-identity' };
  assert.equal(
    getEventCalendarUid(event),
    getEventCalendarUid({ ...event, start: '2027-01-01', sourceUrl: 'https://example.com/new', slug: 'renamed' })
  );
  assert.notEqual(
    getEventCalendarUid({ sourceUrl: event.sourceUrl, calendarId: 'first' }),
    getEventCalendarUid({ sourceUrl: event.sourceUrl, calendarId: 'second' })
  );
});

test('every existing record keeps an independent UID; new ambiguous records fail the regression', () => {
  const uids = events.map((data, index) => eventUid({ id: paths[index].replace(/\.json$/, ''), data }));
  assert.equal(new Set(uids).size, events.length);
  assert.ok(uids.every((uid) => Buffer.byteLength(`UID:${uid}`) <= 75));
});

test('unrecognized source requires explicit immutable identity instead of mutable dates', () => {
  assert.throws(() => getEventCalendarUid({ sourceUrl: 'https://example.com/' }), /calendarId/);
});
