/* eslint-disable no-console -- CLI script */
// Converts downloaded CC0 source maps (1K PNG from Poly Haven) into the WebP set the scene loads.
//
//   node scripts/prepare-textures.mjs <source-dir> [--tile-check <dir>] [--extra <dir>]
//
// <source-dir> holds one folder per asset (asphalt_snow/asphalt_snow_diff_1k.png, ...).
// Output goes to public/textures/<asset>/. See public/textures/CREDITS.md for sources and licences.
//
// Tiers (PROJECT_PLAN §2.7, §5.5):
//   high / medium: 1024² colour + normal + roughness (brick: 512²). Snow has no normal map.
//   low:           512² colour only.
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outRoot = join(root, 'public', 'textures');

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const sourceDir = args[0] && !args[0].startsWith('--') ? resolve(args[0]) : undefined;
const tileCheckDir = flag('--tile-check');
const extraDir = flag('--extra');
if (!sourceDir) {
  console.error(
    'usage: node scripts/prepare-textures.mjs <source-dir> [--tile-check <dir>] [--extra <dir>]',
  );
  process.exit(1);
}

// size: edge length of the maps used on high/medium. lowColor: also write a 512 colour map.
const assets = [
  { id: 'asphalt_snow', size: 1024, maps: ['color', 'normal', 'rough'], lowColor: true },
  { id: 'snow_02', size: 1024, maps: ['color', 'rough'], lowColor: true },
  // Brick is 512² on every tier, so the 512 colour map doubles as the low-tier map.
  { id: 'factory_brick', size: 512, maps: ['color', 'normal', 'rough'], lowColor: false },
];

const sourceFile = { color: 'diff', normal: 'nor_gl', rough: 'rough' };
const webp = {
  color: { quality: 80, effort: 6 },
  normal: { quality: 90, effort: 6, smartSubsample: false },
  rough: { quality: 78, effort: 6 },
};

async function encode(asset, map, size) {
  const src = join(sourceDir, asset, `${asset}_${sourceFile[map]}_1k.png`);
  let img = sharp(await readFile(src)).resize(size, size, { kernel: 'lanczos3' });
  if (map === 'rough') img = img.greyscale();
  return img.webp(webp[map]).toBuffer();
}

const rows = [];
async function write(asset, map, size, tiers) {
  const dir = join(outRoot, asset);
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${asset}_${map}_${size}.webp`);
  const buffer = await encode(asset, map, size);
  await writeFile(file, buffer);
  rows.push({ file: `${asset}/${asset}_${map}_${size}.webp`, kb: buffer.length / 1024, tiers });
}

for (const asset of assets) {
  for (const map of asset.maps) {
    // A 512 colour map that is already the shipped size serves the low tier too.
    const tiers = map === 'color' && asset.size === 512 ? ['high', 'low'] : ['high'];
    await write(asset.id, map, asset.size, tiers);
  }
  if (asset.lowColor) await write(asset.id, 'color', 512, ['low']);
}

// Optional: maps we do not ship, written elsewhere for side-by-side evaluation.
if (extraDir) {
  await mkdir(extraDir, { recursive: true });
  const buffer = await encode('snow_02', 'normal', 1024);
  await writeFile(join(extraDir, 'snow_02_normal_1024.webp'), buffer);
  console.log(
    `extra: snow_02_normal_1024.webp ${(buffer.length / 1024).toFixed(0)} KB (not shipped)`,
  );
}

// Tiling check: 2x2 mosaics of the shipped colour and normal maps, to look for seams.
if (tileCheckDir) {
  await mkdir(tileCheckDir, { recursive: true });
  for (const asset of assets) {
    for (const map of asset.maps.filter((m) => m !== 'rough')) {
      const tile = await sharp(
        await readFile(join(outRoot, asset.id, `${asset.id}_${map}_${asset.size}.webp`)),
      )
        .resize(512, 512)
        .png()
        .toBuffer();
      await sharp({ create: { width: 1024, height: 1024, channels: 3, background: '#000' } })
        .composite([
          { input: tile, left: 0, top: 0 },
          { input: tile, left: 512, top: 0 },
          { input: tile, left: 0, top: 512 },
          { input: tile, left: 512, top: 512 },
        ])
        .png()
        .toFile(join(tileCheckDir, `${asset.id}_${map}_2x2.png`));
    }
  }
  console.log(`tile-check mosaics written to ${tileCheckDir}`);
}

let total = 0;
for (const row of rows) {
  total += row.kb;
  console.log(`${row.kb.toFixed(0).padStart(6)} KB  ${row.file}`);
}
const sum = (tier) => rows.filter((r) => r.tiers.includes(tier)).reduce((acc, r) => acc + r.kb, 0);
console.log(`
all files:        ${(total / 1024).toFixed(2)} MB`);
console.log(`high/medium tier: ${(sum('high') / 1024).toFixed(2)} MB`);
console.log(`low tier:         ${(sum('low') / 1024).toFixed(2)} MB`);
await stat(outRoot);
