import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../dist/events/', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const uid = (calendar: string) => calendar.match(/^UID:(.+)\r?$/m)?.[1].trim();
const feed = read('events.ics');
const feedUids = [...feed.matchAll(/^UID:(.+)\r?$/gm)].map((match) => match[1].trim());
const source = new URL('../src/content/event/', import.meta.url);
const records = readdirSync(source).flatMap((group) =>
  readdirSync(new URL(`${group}/`, source))
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(readFileSync(new URL(`${group}/${file}`, source), 'utf8')))
);
const mirrorRecords = records.filter(
  ({ sourceUrl, sourceIdentity }) =>
    (sourceIdentity?.provider === 'eventbrite' && sourceIdentity.id === '2004500909179') ||
    /^https:\/\/(?:www\.)?eventbrite\.com\/e\/(?:[^/?]+-)?2004500909179\/?(?:[?#]|$)/.test(sourceUrl)
);
const mirrorPaths = new Set(mirrorRecords.map(({ start, slug }) => `${start.slice(0, 10)}/${slug}`));

test('built feed has unique occurrence UIDs', () => {
  assert.equal(feedUids.length, records.length - mirrorRecords.length);
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

test('exact December mirror is absent from aggregate but keeps its detail and individual download', () => {
  const canonical = feed.split('BEGIN:VEVENT').filter((event) => /\/events\/316189328\//.test(event));
  assert.equal(canonical.length, 1);
  assert.equal(uid(canonical[0]), 'e--r3jPIJ5Xg-FdHQyxJwrXUoURSY2Ib0jYHOQ6iAOU@space-coast.dev');
  assert.doesNotMatch(feed, /2004500909179/);
  for (const path of mirrorPaths) {
    const mirror = read(`${path}.ics`);
    assert.match(mirror, /2004500909179/);
    const mirrorUid = uid(mirror);
    assert.ok(mirrorUid);
    assert.ok(!feedUids.includes(mirrorUid));
    assert.match(read(`${path}/index.html`), /2004500909179/);
  }
});

test('every other individual ICS uses an identity from the feed', () => {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const file of readdirSync(new URL(`${entry.name}/`, root))) {
      const path = `${entry.name}/${file}`;
      if (file.endsWith('.ics') && !mirrorPaths.has(path.slice(0, -4))) assert.ok(feedUids.includes(uid(read(path))!));
    }
  }
});
