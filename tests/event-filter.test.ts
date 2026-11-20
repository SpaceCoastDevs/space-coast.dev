import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/filter-events.ts', import.meta.url));
const tsx = createRequire(import.meta.url).resolve('tsx');
const meetup = (id: string) => `https://www.meetup.com/melbourne-makerspace-florida-usa/events/${id}/`;

test('the post-import filter removes only the canceled Meetup occurrences and still filters nonlocal Network Launch', async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), 'scd-event-filter-'));
  const events = path.join(cwd, 'src/content/event');
  const makerspace = path.join(events, 'melbourne-makerspace-florida-usa');
  const networkLaunch = path.join(events, 'network-launch');
  const renamedGroup = path.join(events, 'renamed-group');
  const record = (dir: string, name: string, fields: Record<string, unknown>) =>
    writeFile(path.join(dir, `${name}.json`), JSON.stringify(fields));
  const filtered = () => execFileSync(process.execPath, ['--import', tsx, script], { cwd, encoding: 'utf8' });

  try {
    await Promise.all([makerspace, networkLaunch, renamedGroup].map((dir) => mkdir(dir, { recursive: true })));
    const keptMeetups = {
      '2026-11-19-pottery': '317211491',
      '2026-11-19-open-house-3d-printing': '317212063',
      '2026-11-19-open-house-laser-cutting': '317212533',
      '2026-12-03-pottery': '317109146',
      '2026-12-03-open-house-3d-printing': '317109670',
      '2026-12-03-open-house-laser-cutting': '317110096',
    };
    const otherHost = 'https://www.example.org/events/317319719/';
    const network = { organizer: { name: 'Network Launch' } };
    const restoreFirst = () => record(makerspace, '2026-11-26-pottery', { sourceUrl: meetup('317319719') });
    await Promise.all([
      ...Object.entries(keptMeetups).map(([name, id]) => record(makerspace, name, { sourceUrl: meetup(id) })),
      restoreFirst(),
      record(makerspace, '2026-11-26-open-house-3d-printing', { sourceUrl: `${meetup('317320221')}?from=group` }),
      record(renamedGroup, '2026-11-27-renamed', {
        sourceUrl: 'https://meetup.com/renamed-group/events/317320650',
      }),
      record(renamedGroup, 'other-provider', { sourceUrl: otherHost }),
      record(renamedGroup, 'different-id', { sourceUrl: meetup('3173197190') }),
      record(networkLaunch, 'local', { ...network, title: "Launch on Florida's Space Coast" }),
      record(networkLaunch, 'nonlocal', { ...network, title: 'Palm Beach Launch' }),
    ]);

    assert.match(filtered(), /Removed 3 canceled Meetup occurrence/);
    assert.deepEqual(
      (await readdir(makerspace)).sort(),
      Object.keys(keptMeetups)
        .map((name) => `${name}.json`)
        .sort()
    );
    assert.deepEqual((await readdir(renamedGroup)).sort(), ['different-id.json', 'other-provider.json']);
    assert.deepEqual(await readdir(networkLaunch), ['local.json']);
    assert.match(filtered(), /Removed 0 canceled Meetup occurrence/);
    await restoreFirst();
    assert.match(filtered(), /Removed 1 canceled Meetup occurrence/);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
