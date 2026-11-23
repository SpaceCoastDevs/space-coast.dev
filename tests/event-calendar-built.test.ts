import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../dist/events/', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const uid = (calendar: string) => calendar.match(/^UID:(.+)\r?$/m)?.[1].trim();
const feed = read('events.ics');
const feedUids = [...feed.matchAll(/^UID:(.+)\r?$/gm)].map((match) => match[1].trim());

test('built feed has unique occurrence UIDs', () => {
  const source = new URL('../src/content/event/', import.meta.url);
  const count = readdirSync(source).reduce(
    (total, group) => total + readdirSync(new URL(`${group}/`, source)).filter((file) => file.endsWith('.json')).length,
    0
  );
  assert.equal(feedUids.length, count);
  assert.equal(new Set(feedUids).size, feedUids.length);
});

test('November/December individual downloads match the same feed occurrence', () => {
  const values = ['2026-11-18', '2026-12-16'].map((date) => {
    const calendar = read(`${date}/space-coast-devs-monthly-meetup.ics`);
    const value = uid(calendar);
    assert.ok(value);
    const feedEvent = feed.split('BEGIN:VEVENT').find((event) => uid(event) === value);
    assert.ok(feedEvent);
    assert.equal(feedEvent.match(/^DTSTART:(.+)$/m)?.[1], calendar.match(/^DTSTART:(.+)$/m)?.[1]);
    return value;
  });
  assert.notEqual(values[0], values[1]);
});

test('every generated individual ICS uses an identity from the feed', () => {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const file of readdirSync(new URL(`${entry.name}/`, root))) {
      if (file.endsWith('.ics')) assert.ok(feedUids.includes(uid(read(`${entry.name}/${file}`))!));
    }
  }
});
