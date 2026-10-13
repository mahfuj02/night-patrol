/* eslint-disable no-console -- CLI script */
// Turns the project screenshots into the WebP files the Millennium Library shows.
//
//   node scripts/prepare-project-images.mjs [id ...]
//
// Sources (design/project-images/):
//   raw/<id>.png     real screenshots from `node scripts/capture-project-screenshots.mjs`
//   source/<file>    images the owner supplied (mobile concept designs and so on)
// Output: public/images/projects/<id>.webp
//
// Rules: WebP, quality about 80, landscape at most 1280 px wide, portrait at most 900 px tall, and a
// target of 150 KB or less. If a file is over the target at quality 80 the quality steps down to 55
// until it fits; if it still does not fit the script fails, so a heavy image never ships by accident.
// Each size and the total are printed. Add a project below to include it; the alt text lives in
// src/content/projects.ts.
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(root, 'design', 'project-images');
const outDir = join(root, 'public', 'images', 'projects');

const MAX_WIDTH = 1280;
const MAX_PORTRAIT_HEIGHT = 900;
const TARGET_BYTES = 150 * 1024;
const START_QUALITY = 80;
const MIN_QUALITY = 55;

/** One entry per image: its id (the output name), where it comes from, and what it is. */
const images = [
  { id: 'eventflow', from: 'raw/eventflow.png' },
  { id: 'roleready', from: 'raw/roleready.png' },
  // Game Hub has no image: its screenshot shows other companies' game art, so it gets a typographic cover.
  // The owner's mobile app images, used as concept designs until real captures exist.
  { id: 'safe-drive-ai', from: 'source/safe-drive-screen.jpg' },
  { id: 'connexions-spectrum', from: 'source/connexions.jpg' },
];

const wanted = process.argv.slice(2);
const todo = images.filter((i) => wanted.length === 0 || wanted.includes(i.id));
for (const id of wanted) {
  if (!images.some((i) => i.id === id)) {
    console.error(`unknown image: ${id} (known: ${images.map((i) => i.id).join(', ')})`);
    process.exit(1);
  }
}

await mkdir(outDir, { recursive: true });

async function encode(input, { width, height }) {
  const portrait = height > width;
  const resized = sharp(input).resize({
    ...(portrait
      ? { height: Math.min(height, MAX_PORTRAIT_HEIGHT) }
      : { width: Math.min(width, MAX_WIDTH) }),
    withoutEnlargement: true,
  });
  for (let quality = START_QUALITY; quality >= MIN_QUALITY; quality -= 5) {
    const buffer = await resized.clone().webp({ quality, effort: 6 }).toBuffer();
    if (buffer.length <= TARGET_BYTES) return { buffer, quality };
  }
  return null;
}

let total = 0;
let failed = false;
for (const image of todo) {
  const source = join(sourceRoot, image.from);
  if (!existsSync(source)) {
    console.log(`${image.id}: skipped (no ${image.from})`);
    continue;
  }
  const input = await readFile(source);
  const meta = await sharp(input).metadata();
  const result = await encode(input, {
    width: meta.width ?? MAX_WIDTH,
    height: meta.height ?? 800,
  });
  if (!result) {
    console.error(
      `${image.id}: could not fit ${TARGET_BYTES / 1024} KB even at quality ${MIN_QUALITY}`,
    );
    failed = true;
    continue;
  }
  const file = join(outDir, `${image.id}.webp`);
  await writeFile(file, result.buffer);
  const out = await sharp(result.buffer).metadata();
  const size = (await stat(file)).size;
  total += size;
  console.log(
    `${image.id}: ${out.width}x${out.height}, quality ${result.quality}, ${(size / 1024).toFixed(1)} KB`,
  );
}
console.log(`total: ${(total / 1024).toFixed(1)} KB`);
if (failed) process.exit(1);
