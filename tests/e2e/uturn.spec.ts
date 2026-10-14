import { expect, test, type Page } from '@playwright/test';
import { stops } from '../../src/content';

const total = stops.length;
const status = (page: Page) =>
  page.getByRole('navigation', { name: 'Patrol controls' }).getByRole('status');

type Sample = [number, number, number];

/** Starts recording the car's pose every frame (needs ?probe=on); `stop()` returns what it saw. */
async function record(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __poses: number[][]; __recording: boolean };
    w.__poses = [];
    w.__recording = true;
    const tick = () => {
      if (!w.__recording) return;
      const car = document.body.dataset.car;
      if (car) w.__poses.push(car.split(',').map(Number));
      requestAnimationFrame(tick);
    };
    tick();
  });
  return async () =>
    page.evaluate(() => {
      const w = window as unknown as { __poses: number[][]; __recording: boolean };
      w.__recording = false;
      return w.__poses;
    }) as Promise<Sample[]>;
}

const norm = (a: number) => {
  let x = a;
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x < -Math.PI) x += 2 * Math.PI;
  return x;
};

/** Waits until the car has stopped moving (the status line goes by the target, not the car). */
async function settled(page: Page) {
  let same = 0;
  let last = '';
  await expect
    .poll(
      async () => {
        const car = (await page.evaluate(() => document.body.dataset.car)) ?? '';
        same = car === last ? same + 1 : 0;
        last = car;
        return same;
      },
      { timeout: 150_000, intervals: [600] },
    )
    .toBeGreaterThanOrEqual(4);
}

/** Drives to Dispatch and back to Ignition, recording the car through the trip back. */
async function forwardThenBack(page: Page) {
  await page.goto('/?quality=low&intro=off&probe=on');
  await expect(page.locator('canvas')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => document.body.dataset.car)).toBeTruthy();
  // At the first stop, facing forward, in the right-hand lane: where it will come back to.
  const first = (await page.evaluate(() => document.body.dataset.car))!.split(',').map(Number);
  await page.getByRole('button', { name: 'Next stop ›' }).click();
  await expect(status(page)).toContainText(`Stop 2 of ${total}`, { timeout: 60_000 });
  // Let the car reach the stop and settle.
  await settled(page);
  const stop = await record(page);
  await page.getByRole('button', { name: '‹ Prev' }).click();
  await expect(status(page)).toContainText(`Stop 1 of ${total}`, { timeout: 90_000 });
  await settled(page);
  return { start: first as Sample, samples: await stop() };
}

test.describe('U-turn', () => {
  test('going back, the car turns round and drives back in the other lane, never in reverse', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    const { start, samples } = await forwardThenBack(page);
    expect(samples.length).toBeGreaterThan(30);

    // It ends back at the first stop facing the other way (back toward where it came from) ...
    const end = samples[samples.length - 1]!;
    expect(Math.abs(norm(end[2] - start[2]))).toBeGreaterThan(Math.PI - 0.7);
    // ... in the other lane: across the road from where it started, a lane to a lane apart.
    const apart = Math.hypot(end[0] - start[0], end[1] - start[1]);
    expect(apart).toBeGreaterThan(2.5);
    expect(apart).toBeLessThan(6);

    // It turns round through the whole half turn, smoothly, rather than snapping round.
    const headings = samples.map((s) => s[2]);
    let turned = 0;
    let biggestStep = 0;
    let framesTurning = 0;
    for (let i = 1; i < headings.length; i++) {
      const d = norm(headings[i]! - headings[i - 1]!);
      turned += d;
      biggestStep = Math.max(biggestStep, Math.abs(d));
      if (Math.abs(d) > 0.02) framesTurning++;
    }
    expect(Math.abs(turned)).toBeGreaterThan(Math.PI - 0.8);
    // A software renderer draws only a few frames a second, so a frame can cover a lot of the turn;
    // what matters is that it is spread over several frames and never a single flip.
    expect(biggestStep).toBeLessThan(1.5);
    expect(framesTurning).toBeGreaterThanOrEqual(5);

    // And it never drives in reverse: it always moves the way it faces.
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1]!;
      const b = samples[i]!;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      const moved = Math.hypot(dx, dz);
      if (moved < 0.05) continue;
      const along = (dx * Math.sin(b[2]) + dz * Math.cos(b[2])) / moved;
      expect(along).toBeGreaterThan(-0.25);
    }
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('cuts to the other lane facing back, with no continuous turn', async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize({ width: 1280, height: 800 });
      const { start, samples } = await forwardThenBack(page);
      const end = samples[samples.length - 1]!;
      expect(Math.abs(norm(end[2] - start[2]))).toBeGreaterThan(Math.PI - 0.7);
      // No gradual turn: the heading flips in one step, not through a continuous sweep.
      const headings = samples.map((s) => s[2]);
      let flips = 0;
      for (let i = 1; i < headings.length; i++) {
        if (Math.abs(norm(headings[i]! - headings[i - 1]!)) > 2) flips++;
      }
      expect(flips).toBeGreaterThanOrEqual(1);
    });
  });
});
