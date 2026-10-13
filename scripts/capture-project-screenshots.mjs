/* eslint-disable no-console -- CLI script */
// Takes desktop screenshots of the live project sites for the Millennium Library book view.
//
//   node scripts/capture-project-screenshots.mjs [id ...]
//
// 1280 x 800, the top of the page, after it has loaded. Raw PNGs go to design/project-images/raw/
// (git-ignored: they are regenerated), then `node scripts/prepare-project-images.mjs` turns them
// into the WebP files the site ships. Check each shot by eye before using it: a cookie banner, a
// login wall or a half-loaded page means the site needs a different wait or a different URL.
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rawDir = join(root, 'design', 'project-images', 'raw');

const sites = {
  eventflow: 'https://eventflow-mahfuj.netlify.app',
  roleready: 'https://role-ready-snowy.vercel.app',
  // Game Hub is left out on purpose: its page is full of real game cover art (rule 10).
};

const wanted = process.argv.slice(2);
const ids = wanted.length > 0 ? wanted : Object.keys(sites);
for (const id of ids) {
  if (!sites[id]) {
    console.error(`unknown project: ${id} (known: ${Object.keys(sites).join(', ')})`);
    process.exit(1);
  }
}

await mkdir(rawDir, { recursive: true });
const browser = await chromium.launch();
try {
  for (const id of ids) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(sites[id], { waitUntil: 'load', timeout: 60_000 });
    // Let fonts, images and any client-side render settle.
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const file = join(rawDir, `${id}.png`);
    await page.screenshot({ path: file });
    console.log(`${id}: ${file}`);
    await page.close();
  }
} finally {
  await browser.close();
}
