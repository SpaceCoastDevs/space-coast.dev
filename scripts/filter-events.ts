import { readdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';

interface EventRecord {
  title?: string;
  organizer?: {
    name?: string;
  };
}

const eventsDirectory = path.resolve(process.cwd(), 'src/content/event');
const networkLaunchDirectory = path.join(eventsDirectory, 'network-launch');
const localSeriesName = "FLORIDA'S SPACE COAST";

const entries = await readdir(networkLaunchDirectory, { withFileTypes: true });
let removed = 0;

for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.json')) continue;

  const eventPath = path.join(networkLaunchDirectory, entry.name);
  const event = JSON.parse(await readFile(eventPath, 'utf8')) as EventRecord;
  const isNetworkLaunch = event.organizer?.name?.trim().toLowerCase() === 'network launch';
  const isBrevardEvent = event.title?.toUpperCase().includes(localSeriesName) === true;

  if (isNetworkLaunch && !isBrevardEvent) {
    await unlink(eventPath);
    removed += 1;
    console.log(`Removed non-Brevard Network Launch event: ${entry.name}`);
  }
}

console.log(`Removed ${removed} non-Brevard Network Launch event record${removed === 1 ? '' : 's'}.`);
