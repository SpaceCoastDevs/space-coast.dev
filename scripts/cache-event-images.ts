import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

interface EventRecord {
  imageUrl?: string;
}

const root = process.cwd();
const eventsDirectory = path.join(root, 'src/content/event');
const outputDirectory = path.join(root, 'public/event-images');
const maxImageBytes = 15 * 1024 * 1024;

const extensionForContentType = (contentType: string) => {
  const normalized = contentType.split(';', 1)[0].toLowerCase();
  return {
    'image/avif': 'avif',
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }[normalized];
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

async function cacheImage(imageUrl: string) {
  const response = await fetch(imageUrl, { redirect: 'follow' });
  if (!response.ok) throw new Error(`received ${response.status}`);

  const contentType = response.headers.get('content-type') || '';
  const extension = extensionForContentType(contentType);
  if (!extension) throw new Error(`unsupported content type: ${contentType || 'unknown'}`);

  const length = Number(response.headers.get('content-length'));
  if (Number.isFinite(length) && length > maxImageBytes) {
    throw new Error(`image exceeds ${maxImageBytes / 1024 / 1024} MB`);
  }

  const image = new Uint8Array(await response.arrayBuffer());
  if (image.length > maxImageBytes) throw new Error(`image exceeds ${maxImageBytes / 1024 / 1024} MB`);

  const contentHash = createHash('sha256').update(image).digest('hex').slice(0, 16);
  const outputName = `source-${contentHash}.${extension}`;
  const outputFile = path.join(outputDirectory, outputName);
  if (!(await fs.stat(outputFile).catch(() => null))) await fs.writeFile(outputFile, image);
  return `/event-images/${outputName}`;
}

async function main() {
  await fs.mkdir(outputDirectory, { recursive: true });
  const files = await eventFiles(eventsDirectory);
  const dedupeExisting = process.argv.includes('--dedupe');
  const cachedUrls = new Map<string, string>();
  const staleFiles = new Set<string>();
  let cached = 0;
  let deduplicated = 0;
  let failed = 0;

  for (const eventFile of files) {
    const event = JSON.parse(await fs.readFile(eventFile, 'utf8')) as EventRecord;
    if (!event.imageUrl) continue;

    try {
      if (event.imageUrl.startsWith('http')) {
        const sourceUrl = event.imageUrl;
        const cachedUrl = cachedUrls.get(sourceUrl);
        event.imageUrl = cachedUrl || (await cacheImage(sourceUrl));
        cachedUrls.set(sourceUrl, event.imageUrl);
        cached++;
      } else if (dedupeExisting && event.imageUrl.startsWith('/event-images/')) {
        const currentFile = path.join(outputDirectory, path.basename(event.imageUrl));
        const image = await fs.readFile(currentFile);
        const extension = path.extname(currentFile);
        const contentHash = createHash('sha256').update(image.toString('base64'), 'base64').digest('hex').slice(0, 16);
        const cachedFile = path.join(outputDirectory, `source-${contentHash}${extension}`);
        const cachedUrl = `/event-images/${path.basename(cachedFile)}`;
        if (currentFile !== cachedFile) {
          if (!(await fs.stat(cachedFile).catch(() => null))) await fs.copyFile(currentFile, cachedFile);
          staleFiles.add(currentFile);
          event.imageUrl = cachedUrl;
          deduplicated++;
        }
      } else {
        continue;
      }
      await fs.writeFile(eventFile, `${JSON.stringify(event, null, 2)}\n`);
    } catch (error) {
      failed++;
      console.warn(`Could not cache image for ${eventFile}: ${(error as Error).message}`);
    }
  }

  await Promise.all([...staleFiles].map((file) => fs.rm(file, { force: true })));
  console.log(
    `Cached ${cached} event image${cached === 1 ? '' : 's'}; deduplicated ${deduplicated}${failed ? `; ${failed} failed` : ''}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
