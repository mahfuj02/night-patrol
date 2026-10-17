import { expect, test, type Page } from '@playwright/test';
import { norm, openProbe, record, settled, status, total, type Pose } from './loopHelpers';

/** Drives to Dispatch, then presses Turn around, recording the car through the turn. */
async function turnAtDispatch(page: Page) {
  await openProbe(page);
  await page.getByRole('button', { name: 'Next stop ›' }).click();
  await expect(status(page)).toContainText(`Stop 2 of ${total}`, { timeout: 60_000 });
  // Let the car reach the stop and settle.
  await settled(page);
  const before = (await page.evaluate(() => document.body.dataset.car))!
    .split(',')
    .map(Number) as Pose;
  const stop = await record(page);
  await page.getByRole('button', { name: 'Turn around' }).click();
  // The status goes by the target: after the turn the car is heading back.
  await expect(status(page)).toContainText('heading back', { timeout: 90_000 });
  await settled(page);
  return { before, samples: await stop() };
}

test.describe('Turn around', () => {
  test('turns the car round in the road, once, into the other lane, never in reverse', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    const { before, samples } = await turnAtDispatch(page);
    expect(samples.length).toBeGreaterThan(20);

    // It ends facing the other way, in the other lane, a little further on than where it was.
    const end = samples[samples.length - 1]!;
    expect(Math.abs(norm(end[2] - before[2]))).toBeGreaterThan(Math.PI - 0.7);
    const apart = Math.hypot(end[0] - before[0], end[1] - before[1]);
    expect(apart).toBeGreaterThan(2.5);
    expect(apart).toBeLessThan(25);

    // It turns round through one whole half turn, smoothly, rather than snapping round or spinning.
    let turned = 0;
    let biggestStep = 0;
    let framesTurning = 0;
    for (let i = 1; i < samples.length; i++) {
      const d = norm(samples[i]![2] - samples[i - 1]![2]);
      turned += d;
      biggestStep = Math.max(biggestStep, Math.abs(d));
      if (Math.abs(d) > 0.02) framesTurning++;
    }
    expect(Math.abs(turned)).toBeGreaterThan(Math.PI - 0.8);
    expect(Math.abs(turned)).toBeLessThan(Math.PI + 0.8);
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

  test('is offered after braking, and scrolling back only ever brakes', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openProbe(page);
    await page.mouse.move(400, 300);
    await page.mouse.wheel(0, 100);
    await page.mouse.wheel(0, -100);
    await expect(page.getByText(/To drive the other way, press Turn around/)).toBeVisible();
    // A lot of jittery scrolling later it has never turned round: still heading out.
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 40);
      await page.mouse.wheel(0, -40);
    }
    await settled(page);
    await expect(status(page)).not.toContainText('heading back');
    await expect(page.getByRole('heading', { name: 'Route · outbound' })).toBeVisible();
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('cuts to the other lane facing back, with no continuous turn', async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize({ width: 1280, height: 800 });
      const { before, samples } = await turnAtDispatch(page);
      const end = samples[samples.length - 1]!;
      expect(Math.abs(norm(end[2] - before[2]))).toBeGreaterThan(Math.PI - 0.7);
      // No gradual turn: the heading flips in one step, not through a continuous sweep.
      let flips = 0;
      for (let i = 1; i < samples.length; i++) {
        if (Math.abs(norm(samples[i]![2] - samples[i - 1]![2])) > 2) flips++;
      }
      expect(flips).toBeGreaterThanOrEqual(1);
    });
  });
});
