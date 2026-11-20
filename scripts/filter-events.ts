import { readdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';

interface EventRecord {
  sourceUrl?: string;
  title?: string;
  organizer?: {
    name?: string;
  };
}

const eventsDirectory = path.resolve(process.cwd(), 'src/content/event');
const localSeriesName = "FLORIDA'S SPACE COAST";
// Organizer canceled these three Thanksgiving 2026 occurrences. Use provider IDs
// so a fresh import or a changed date/title/filename does not resurrect them.
const canceledMeetupIds = new Set(['317319719', '317320221', '317320650']);

function isCanceledMeetupOccurrence(sourceUrl?: string): boolean {
  if (!sourceUrl) return false;
  try {
    const url = new URL(sourceUrl);
    if (!['http:', 'https:'].includes(url.protocol) || !['meetup.com', 'www.meetup.com'].includes(url.hostname)) {
      return false;
    }
    const id = url.pathname.match(/\/events\/(\d+)\/?$/)?.[1];
    return id !== undefined && canceledMeetupIds.has(id);
  } catch {
    return false;
  }
}

let canceledMeetupsRemoved = 0;
let nonBrevardRemoved = 0;
for (const group of await readdir(eventsDirectory, { withFileTypes: true })) {
  if (!group.isDirectory()) continue;

  const groupDirectory = path.join(eventsDirectory, group.name);
  for (const entry of await readdir(groupDirectory, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;

    const eventPath = path.join(groupDirectory, entry.name);
    const event = JSON.parse(await readFile(eventPath, 'utf8')) as EventRecord;
    if (isCanceledMeetupOccurrence(event.sourceUrl)) {
      await unlink(eventPath);
      canceledMeetupsRemoved += 1;
      console.log(`Removed canceled Meetup occurrence: ${event.sourceUrl} (${group.name}/${entry.name})`);
      continue;
    }

    const isNetworkLaunch =
      group.name === 'network-launch' && event.organizer?.name?.trim().toLowerCase() === 'network launch';
    const isBrevardEvent = event.title?.toUpperCase().includes(localSeriesName) === true;
    if (isNetworkLaunch && !isBrevardEvent) {
      await unlink(eventPath);
      nonBrevardRemoved += 1;
      console.log(`Removed non-Brevard Network Launch event: ${entry.name}`);
    }
  }
}

console.log(`Removed ${canceledMeetupsRemoved} canceled Meetup occurrence(s).`);
console.log(
  `Removed ${nonBrevardRemoved} non-Brevard Network Launch event record${nonBrevardRemoved === 1 ? '' : 's'}.`
);
