import { expect, test, type Page } from '@playwright/test';
import { route, stops } from '../../src/content';

// A software renderer draws only a frame or two a second, so give driving to The Forks, parking and
// backing out plenty of real time.
const MANEUVER = 150_000;
const total = stops.length;

// The end of the road and its direction, from the last two route points (the road axis there).
const [before, last] = route.points.slice(-2) as [
  (typeof route.points)[number],
  (typeof route.points)[number],
];
const length = Math.hypot(last.x - before.x, last.z - before.z);
const forward = { x: (last.x - before.x) / length, z: (last.z - before.z) / length };
/** Metres ahead of the end of the road (along) and to the left of it (across), for a car position. */
const along = (x: number, z: number) => (x - last.x) * forward.x + (z - last.z) * forward.z;
const across = (x: number, z: number) => (x - last.x) * forward.z + (z - last.z) * -forward.x;
// The ring's centre is straight ahead of the end of the road, one outer radius (22 m) away.
const RING_OUTER = 22;
const RING_CENTRELINE = 17;

const status = (page: Page) =>
  page.getByRole('navigation', { name: 'Patrol controls' }).getByRole('status');
const map = (page: Page) => page.getByRole('navigation', { name: 'Route map' });

/** Drives to The Forks through the route map and leaves its station, so the car is at the last stop. */
async function atTheEnd(page: Page, url = '/?quality=low&intro=off') {
  await page.goto(url);
  await expect(page.locator('canvas')).toBeVisible();
  if (!(await map(page).isVisible())) await page.getByRole('button', { name: 'Route map' }).click();
  await map(page)
    .getByRole('button', { name: /The Forks/ })
    .click();
  await expect(page.getByRole('complementary', { name: 'Contact' })).toBeVisible({
    timeout: MANEUVER,
  });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('complementary', { name: 'Contact' })).toBeHidden({
    timeout: MANEUVER,
  });
  await expect(status(page)).toContainText(`Stop ${total} of ${total}`, { timeout: MANEUVER });
}

test.describe('end of shift', () => {
  test('New patrol really moves the car: onto the ring, once round it, and back onto the road', async ({
    page,
  }) => {
    // Nothing here depends on how fast the machine is: the lap is followed by where the car actually
    // is, frame by frame, and it is over when the car is back on the road behind the ring (or the
    // shift has moved on, which fails the checks below).
    test.setTimeout(1_200_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await atTheEnd(page, '/?quality=low&intro=off&probe=on');
    const lap = page.evaluate(
      ({ end, f }) =>
        new Promise<number[][]>((resolve) => {
          const samples: number[][] = [];
          const veil = document.querySelector('[data-testid=shift-fade]')!;
          const along = (x: number, z: number) => (x - end.x) * f.x + (z - end.z) * f.z;
          const across = (x: number, z: number) => (x - end.x) * f.z + (z - end.z) * -f.x;
          let started = false;
          let furthest = -Infinity;
          const tick = () => {
            const car = document.body.dataset.car;
            const shift = veil.getAttribute('data-shift');
            if (car && shift === 'looping') {
              started = true;
              const pose = car.split(',').map(Number);
              samples.push(pose);
              furthest = Math.max(furthest, along(pose[0]!, pose[1]!));
              // Back on the road behind the ring, in the other lane, after going round: done.
              if (
                furthest > 30 &&
                along(pose[0]!, pose[1]!) < -14 &&
                across(pose[0]!, pose[1]!) > 0.5
              ) {
                return resolve(samples);
              }
            }
            if (started && shift !== 'looping') return resolve(samples);
            requestAnimationFrame(tick);
          };
          tick();
        }),
      { end: { x: last.x, z: last.z }, f: forward },
    );
    await page.getByRole('button', { name: 'New patrol ›' }).click();
    const samples = await lap;
    expect(samples.length).toBeGreaterThan(20);

    // It starts on the road, in its own lane, short of the end of the road.
    const first = samples[0]!;
    expect(along(first[0]!, first[1]!)).toBeLessThan(0);
    expect(Math.abs(across(first[0]!, first[1]!))).toBeLessThan(5);
    // It moves forward: it passes the end of the road and gets well past it.
    const furthest = Math.max(...samples.map((p) => along(p[0]!, p[1]!)));
    expect(furthest).toBeGreaterThan(2 * RING_OUTER - 8);
    // It goes round the ring: it spends a good part of the lap on the ring's centre line.
    const centre = { x: last.x + forward.x * RING_OUTER, z: last.z + forward.z * RING_OUTER };
    const onRing = samples.filter(
      (p) => Math.abs(Math.hypot(p[0]! - centre.x, p[1]! - centre.z) - RING_CENTRELINE) < 1,
    );
    expect(onRing.length).toBeGreaterThan(samples.length / 3);
    // It reaches both sides of the ring (the car's right first, then its left).
    expect(Math.min(...samples.map((p) => across(p[0]!, p[1]!)))).toBeLessThan(-12);
    expect(Math.max(...samples.map((p) => across(p[0]!, p[1]!)))).toBeGreaterThan(12);

    // It ends back on the road, behind the end of it, in the right-hand lane for heading back to the
    // city (to the left of the way it came), facing back along the road.
    const end = samples[samples.length - 1]!;
    expect(along(end[0]!, end[1]!)).toBeLessThan(-14);
    expect(across(end[0]!, end[1]!)).toBeGreaterThan(0.5);
    expect(across(end[0]!, end[1]!)).toBeLessThan(5);
    expect(Math.sin(end[2]!) * forward.x + Math.cos(end[2]!) * forward.z).toBeLessThan(-0.9);

    // Then the fade and the reset.
    await expect(status(page)).toContainText(`Stop 1 of ${total}: Ignition`, { timeout: 300_000 });
  });

  test('New patrol loops the roundabout, fades out and starts again at the first stop', async ({
    page,
  }) => {
    test.setTimeout(1_200_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await atTheEnd(page);
    const button = page.getByRole('button', { name: 'New patrol ›' });
    await expect(button).toBeVisible();
    await button.click();
    // The car loops the roundabout with the caption up, and the Open button is not offered.
    await expect(page.getByRole('region', { name: 'Dispatch radio' })).toContainText(
      'New patrol starting.',
    );
    await expect(page.getByRole('button', { name: 'Open Contact' })).toHaveCount(0);
    await expect(status(page)).toContainText(`Stop 1 of ${total}: Ignition`, { timeout: 900_000 });
    await expect(page.getByRole('button', { name: 'Next stop ›' })).toBeVisible();
    // The page keeps working: the veil takes no clicks and is gone.
    await expect(page.getByTestId('shift-fade')).toHaveAttribute('data-shift', 'idle');
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('cuts straight back to the first stop, with no veil', async ({ page }) => {
      test.setTimeout(400_000);
      await page.setViewportSize({ width: 1280, height: 800 });
      await atTheEnd(page);
      await expect(page.getByTestId('shift-fade')).toBeHidden();
      await page.getByRole('button', { name: 'New patrol ›' }).click();
      await expect(status(page)).toContainText(`Stop 1 of ${total}: Ignition`, { timeout: 30_000 });
    });
  });
});
