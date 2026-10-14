import { expect, test, type Page } from '@playwright/test';
import { stops } from '../../src/content';

// A software renderer draws only a frame or two a second, so give driving to The Forks, parking and
// backing out plenty of real time.
const MANEUVER = 150_000;
const total = stops.length;

const status = (page: Page) =>
  page.getByRole('navigation', { name: 'Patrol controls' }).getByRole('status');
const map = (page: Page) => page.getByRole('navigation', { name: 'Route map' });

/** Drives to The Forks through the route map and leaves its station, so the car is at the last stop. */
async function atTheEnd(page: Page) {
  await page.goto('/?quality=low&intro=off');
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
  test('New patrol fades out and starts again at the first stop', async ({ page }) => {
    test.setTimeout(400_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await atTheEnd(page);
    const button = page.getByRole('button', { name: 'New patrol ›' });
    await expect(button).toBeVisible();
    await button.click();
    await expect(status(page)).toContainText(`Stop 1 of ${total}: Ignition`, { timeout: 60_000 });
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
