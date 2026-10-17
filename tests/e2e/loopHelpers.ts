import { expect, type Page } from '@playwright/test';
import { route, stops } from '../../src/content';

/** Shared by the loop specs. Most of it follows the car by where it is (`?probe=on`), not by the clock. */

// A software renderer draws only a frame or two a second, so give driving, parking and the
// roundabouts plenty of real time.
export const MANEUVER = 150_000;
export const total = stops.length;

export const status = (page: Page) =>
  page.getByRole('navigation', { name: 'Patrol controls' }).getByRole('status');
export const map = (page: Page) => page.getByRole('navigation', { name: 'Route map' });

export type Pose = [number, number, number];

export const norm = (a: number) => {
  let x = a;
  while (x > Math.PI) x -= 2 * Math.PI;
  while (x < -Math.PI) x += 2 * Math.PI;
  return x;
};

// The end of the road and its direction, from the last two route points (the road axis there).
const [before, last] = route.points.slice(-2) as [
  (typeof route.points)[number],
  (typeof route.points)[number],
];
const length = Math.hypot(last.x - before.x, last.z - before.z);
export const forksEnd = { x: last.x, z: last.z };
export const forward = { x: (last.x - before.x) / length, z: (last.z - before.z) / length };
/** Metres ahead of the end of the road (along) and to the left of it (across), for a car position. */
export const along = (x: number, z: number) =>
  (x - forksEnd.x) * forward.x + (z - forksEnd.z) * forward.z;
export const across = (x: number, z: number) =>
  (x - forksEnd.x) * forward.z + (z - forksEnd.z) * -forward.x;
/** The Forks ring: centre straight ahead of the end of the road, outer radius 22, centre line 17. */
export const RING_OUTER = 22;
export const RING_CENTRELINE = 17;

export async function openProbe(page: Page, url = '/?quality=low&intro=off&probe=on') {
  await page.goto(url);
  await expect(page.locator('canvas')).toBeVisible();
  await expect.poll(async () => page.evaluate(() => document.body.dataset.car)).toBeTruthy();
}

export async function pose(page: Page): Promise<Pose> {
  const car = await page.evaluate(() => document.body.dataset.car);
  return (car ?? '0,0,0').split(',').map(Number) as Pose;
}

/** Waits until the car has stopped moving (the status line goes by the target, not the car). */
export async function settled(page: Page, timeout = MANEUVER) {
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
      { timeout, intervals: [600] },
    )
    .toBeGreaterThanOrEqual(4);
}

/** Opens the route map if it is shut, and goes to a stop or station. */
export async function mapGo(page: Page, name: RegExp | string) {
  if (!(await map(page).isVisible())) await page.getByRole('button', { name: 'Route map' }).click();
  await map(page).getByRole('button', { name }).click();
}

/** Drives to The Forks through the route map, leaves its station and waits for the car to settle. */
export async function atTheForks(page: Page) {
  await mapGo(page, /The Forks/);
  await expect(page.getByRole('complementary', { name: 'Contact' })).toBeVisible({
    timeout: MANEUVER,
  });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('complementary', { name: 'Contact' })).toBeHidden({
    timeout: MANEUVER,
  });
  await expect(status(page)).toContainText(`Stop ${total} of ${total}`, { timeout: MANEUVER });
  await settled(page);
}

/** Starts recording the car's pose every frame; `stop()` returns what it saw. */
export async function record(page: Page) {
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
    }) as Promise<Pose[]>;
}
