import { expect, test, type Page } from '@playwright/test';
import { stations, stops } from '../../src/content';
import {
  MANEUVER,
  RING_CENTRELINE,
  RING_OUTER,
  across,
  along,
  atTheForks,
  forksEnd,
  forward,
  mapGo,
  norm,
  openProbe,
  pose,
  record,
  settled,
  untilAt,
  status,
  total,
  type Pose,
} from './loopHelpers';

const radio = (page: Page) => page.getByRole('region', { name: 'Dispatch radio' });
const nextStop = (page: Page) => page.getByRole('button', { name: 'Next stop ›' });
const dispatch = stops.findIndex((s) => s.id === 'dispatch');
const education = stations[0]!;
const rrc = stops.findIndex((s) => s.id === education.stopId);

/** Waits until the car is back on the road behind The Forks roundabout, in the lane heading back. */
async function untilBackOnRoad(page: Page) {
  await expect
    .poll(
      async () => {
        const p = await pose(page);
        return along(p[0], p[1]) < -14 && across(p[0], p[1]) > 0.5;
      },
      { timeout: 600_000, intervals: [700] },
    )
    .toBe(true);
}

test.describe('the patrol loop', () => {
  test('past The Forks the car drives round the roundabout by itself and comes back along the road', async ({
    page,
  }) => {
    // Nothing here depends on how fast the machine is: the lap is followed by where the car actually
    // is, frame by frame, and it is over when the car is back on the road behind the ring.
    test.setTimeout(1_200_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openProbe(page);
    await atTheForks(page);
    const stop = await record(page);
    await nextStop(page).click();
    // The caption and the status say it is heading back now, at the next stop on the way.
    await expect(status(page)).toContainText(`Stop ${total - 1} of ${total}`);
    await expect(status(page)).toContainText('heading back');
    // No button: nothing but driving on. Brake and Turn around are inert on the roundabout.
    await untilBackOnRoad(page);
    const samples = await stop();
    expect(samples.length).toBeGreaterThan(20);

    // It starts on the road, in its own lane, short of the end of the road.
    const first = samples[0]!;
    expect(along(first[0], first[1])).toBeLessThan(0);
    expect(Math.abs(across(first[0], first[1]))).toBeLessThan(5);
    // It passes the end of the road and gets well past it.
    const furthest = Math.max(...samples.map((p) => along(p[0], p[1])));
    expect(furthest).toBeGreaterThan(2 * RING_OUTER - 8);
    // It goes round the ring: it spends a good part of the lap on the ring's centre line.
    const centre = {
      x: forksEnd.x + forward.x * RING_OUTER,
      z: forksEnd.z + forward.z * RING_OUTER,
    };
    const onRing = samples.filter(
      (p) => Math.abs(Math.hypot(p[0] - centre.x, p[1] - centre.z) - RING_CENTRELINE) < 1,
    );
    expect(onRing.length).toBeGreaterThan(samples.length / 5);
    // It reaches both sides of the ring (the car's right first, then its left).
    expect(Math.min(...samples.map((p) => across(p[0], p[1])))).toBeLessThan(-12);
    expect(Math.max(...samples.map((p) => across(p[0], p[1])))).toBeGreaterThan(12);

    // It ends back on the road, behind the end of it, in the lane for heading back to the city
    // (to the left of the way it came), facing back along the road.
    const end = await pose(page);
    expect(along(end[0], end[1])).toBeLessThan(-14);
    expect(across(end[0], end[1])).toBeGreaterThan(0.5);
    expect(across(end[0], end[1])).toBeLessThan(5);
    expect(Math.sin(end[2]) * forward.x + Math.cos(end[2]) * forward.z).toBeLessThan(-0.9);

    // Then it drives on to the next stop on the way back and stays there.
    await settled(page);
    await expect(status(page)).toContainText(`Stop ${total - 1} of ${total}`);
    await expect(status(page)).toContainText('LIILAB office · heading back');
  });

  test('all the way round: heading back past Dispatch, round the turnaround behind Ignition, out again', async ({
    page,
  }) => {
    test.setTimeout(1_800_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openProbe(page);
    const start = await pose(page);
    await atTheForks(page);
    await nextStop(page).click();
    await untilBackOnRoad(page);

    // Dispatch on the way back: its own radio line, and the call that starts the patrol is not said.
    await mapGo(page, /Dispatch/);
    await expect(status(page)).toContainText(
      `Stop ${dispatch + 1} of ${total}: Dispatch · heading back`,
    );
    await settled(page);
    await expect(radio(page)).toContainText('Unit 02, heading back to base.');
    await expect(radio(page)).not.toContainText('starting patrol');

    // Next stop: past Ignition, round the turnaround, and out again at the first stop.
    const stop = await record(page);
    await nextStop(page).click();
    await expect(status(page)).toContainText(`Stop 1 of ${total}: Ignition · outbound`);
    // Back where it started the patrol: the same spot, facing the same way (followed by position).
    await untilAt(page, start);
    const samples = await stop();
    // It went round the turnaround to get there: well behind Ignition, and through half a turn at least.
    const farthest = Math.max(...samples.map((p) => Math.hypot(p[0] - start[0], p[1] - start[1])));
    expect(farthest).toBeGreaterThan(18);
    let turned = 0;
    for (let i = 1; i < samples.length; i++) turned += norm(samples[i]![2] - samples[i - 1]![2]);
    expect(Math.abs(turned)).toBeGreaterThan(Math.PI - 0.8);

    // The next time round Dispatch does not say "starting patrol" again.
    await nextStop(page).click();
    await expect(status(page)).toContainText(
      `Stop ${dispatch + 1} of ${total}: Dispatch · outbound`,
    );
    await settled(page);
    await expect(radio(page)).not.toContainText('starting patrol');
    await expect(radio(page)).not.toContainText('heading back');
  });

  test('Start over fades out and starts again at the first stop, heading out', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openProbe(page);
    const start = await pose(page);
    await atTheForks(page);
    await page.getByRole('button', { name: 'Start over' }).click();
    await expect(status(page)).toContainText(`Stop 1 of ${total}: Ignition · outbound`, {
      timeout: 60_000,
    });
    await expect(page.getByTestId('shift-fade')).toHaveAttribute('data-shift', 'idle', {
      timeout: 60_000,
    });
    // A cut, not a drive back along the road: it is at the start.
    await untilAt(page, start);
    // And no "new patrol" caption.
    await expect(radio(page)).not.toContainText('New patrol');
  });

  test('a station opens from the way back, the car parking from the other lane', async ({
    page,
  }) => {
    test.setTimeout(900_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openProbe(page);
    await atTheForks(page);
    // Education is a long way back: nearer by turning round once than by driving the loop, so it
    // arrives heading back, on the other lane.
    const stop = await record(page);
    await mapGo(page, /RRC Polytechnic/);
    await expect(status(page)).toContainText(`Stop ${rrc + 1} of ${total}`);
    await expect(status(page)).toContainText('heading back');
    await expect(
      page.getByRole('region', { name: 'Diploma in Full Stack Web Development' }),
    ).toBeVisible({ timeout: MANEUVER });
    const samples = await stop();
    // It turned round once on the way: the heading went through half a turn, then it drove back.
    let turned = 0;
    for (let i = 1; i < samples.length; i++) turned += norm(samples[i]![2] - samples[i - 1]![2]);
    expect(Math.abs(turned)).toBeGreaterThan(Math.PI - 1);
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('region', { name: 'Diploma in Full Stack Web Development' }),
    ).toBeHidden({ timeout: MANEUVER });
    // Back on the road, still heading back.
    await expect(status(page)).toContainText('heading back');
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('cuts round the roundabout: past The Forks it is straight on the way back, with no continuous turn', async ({
      page,
    }) => {
      test.setTimeout(600_000);
      await page.setViewportSize({ width: 1280, height: 800 });
      await openProbe(page);
      await atTheForks(page);
      const stop = await record(page);
      await nextStop(page).click();
      await expect(status(page)).toContainText('heading back');
      await untilBackOnRoad(page);
      // Facing back along the road, in the lane for heading back, the moment it is behind the ring.
      const near = await pose(page);
      expect(Math.sin(near[2]) * forward.x + Math.cos(near[2]) * forward.z).toBeLessThan(-0.9);
      await settled(page);
      const samples: Pose[] = await stop();
      // It never drove round the ring: no sample is out past the end of the road.
      expect(Math.max(...samples.map((p) => along(p[0], p[1])))).toBeLessThan(RING_OUTER);
      await expect(status(page)).toContainText('LIILAB office · heading back');
    });
  });
});
