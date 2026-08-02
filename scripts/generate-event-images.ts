import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

interface EventRecord {
  title: string;
  start: string;
  organizer: { name: string };
  imageUrl?: string;
}

const root = process.cwd();
const eventsDirectory = path.join(root, 'src/content/event');
const backgroundImage = path.join(root, 'src/assets/images/space-coast-devs-styled-bg.png');
const outputDirectory = path.join(root, 'public/event-images');

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const wrapText = (value: string, maxCharacters: number, maxLines: number) => {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxCharacters || !line) {
      line = candidate;
      continue;
    }
    lines.push(line);
    line = word;
    if (lines.length === maxLines - 1) break;
  }

  if (line && lines.length < maxLines) lines.push(line);
  const remainingWords = words.slice(lines.join(' ').split(/\s+/).filter(Boolean).length);
  if (remainingWords.length && lines.length)
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[.…]+$/, '')}…`;
  return lines;
};

const getEasternDateTime = (start: string) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
  }).format(new Date(start));

const createCard = async (event: EventRecord, outputFile: string) => {
  const titleLines = wrapText(event.title, 18, 3);
  const titleSvg = titleLines
    .map((line, index) => `<tspan x="86" dy="${index === 0 ? 0 : 72}">${escapeXml(line)}</tspan>`)
    .join('');
  const titleY = titleLines.length === 1 ? 280 : titleLines.length === 2 ? 244 : 208;
  const overlay = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="720" height="630" fill="#020617" fill-opacity="0.48" />
      <rect x="86" y="112" width="230" height="38" rx="19" fill="#0161ef" />
      <text x="201" y="138" text-anchor="middle" fill="white" font-family="Verdana, sans-serif" font-size="17" font-weight="700" letter-spacing="1.3">SPACE COAST DEVS</text>
      <text x="86" y="${titleY}" fill="white" font-family="Verdana, sans-serif" font-size="54" font-weight="700">${titleSvg}</text>
      <line x1="86" y1="478" x2="570" y2="478" stroke="#60a5fa" stroke-width="3" />
      <text x="86" y="526" fill="#dbeafe" font-family="Verdana, sans-serif" font-size="27" font-weight="700">${escapeXml(getEasternDateTime(event.start))}</text>
      <text x="86" y="568" fill="#bfdbfe" font-family="Verdana, sans-serif" font-size="22">${escapeXml(event.organizer.name)}</text>
    </svg>
  `);

  await sharp(backgroundImage)
    .resize(1200, 630, { fit: 'cover' })
    .composite([{ input: overlay }])
    .png()
    .toFile(outputFile);
};

const eventFiles = async (directory: string): Promise<string[]> => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const filePath = path.join(directory, entry.name);
      return entry.isDirectory() ? eventFiles(filePath) : entry.name.endsWith('.json') ? [filePath] : [];
    })
  );
  return files.flat();
};

async function main() {
  await fs.mkdir(outputDirectory, { recursive: true });
  const files = await eventFiles(eventsDirectory);
  let generated = 0;

  for (const eventFile of files) {
    const event = JSON.parse(await fs.readFile(eventFile, 'utf8')) as EventRecord;
    const isSpaceCoastDevs = event.organizer.name === 'Space Coast Devs';
    if (!isSpaceCoastDevs && event.imageUrl) continue;

    const outputName = `${path.basename(eventFile, '.json')}.png`;
    const outputFile = path.join(outputDirectory, outputName);
    const imageUrl = `/event-images/${outputName}`;
    await createCard(event, outputFile);

    if (event.imageUrl !== imageUrl) {
      event.imageUrl = imageUrl;
      await fs.writeFile(eventFile, `${JSON.stringify(event, null, 2)}\n`);
    }
    generated++;
  }

  console.log(`Generated ${generated} branded event image${generated === 1 ? '' : 's'}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
