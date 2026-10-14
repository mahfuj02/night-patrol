import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// A software renderer draws only a frame or two a second, so give driving there, turning in and
// backing out plenty of real time.
const MANEUVER = 150_000;

const panel = (page: Page) => page.getByRole('complementary', { name: 'Experience' });
const map = (page: Page) => page.getByRole('navigation', { name: 'Route map' });

/** Opens the Experience station from the route map: the car drives there, turns right and parks. */
async function openExperience(page: Page) {
  await page.goto('/?quality=low');
  await expect(page.locator('canvas')).toBeVisible();
  if (!(await map(page).isVisible())) await page.getByRole('button', { name: 'Route map' }).click();
  await map(page)
    .getByRole('button', { name: /LIILAB office/ })
    .click();
  await expect(panel(page)).toBeVisible({ timeout: MANEUVER });
}

test.describe('Experience station', () => {
  test('parks at the LIILAB office and lists the entries, with no axe violations', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openExperience(page);
    await expect(
      panel(page).getByRole('heading', { name: 'Junior Software Engineer' }),
    ).toBeVisible();
    await expect(panel(page).getByText('Feb 2021 – May 2023')).toBeVisible();
    await expect(
      panel(page).getByRole('heading', { name: 'Sprint-Innovation 2025: Winner' }),
    ).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Escape leaves the station and the car backs out', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openExperience(page);
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden({ timeout: MANEUVER });
  });

  test('is a bottom sheet on a phone', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await openExperience(page);
    const box = await panel(page).boundingBox();
    const next = await page.getByRole('button', { name: 'Next stop ›' }).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    expect(box!.y + box!.height).toBeLessThanOrEqual(next!.y + 1);
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('cuts straight to the office', async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize({ width: 1280, height: 800 });
      await openExperience(page);
      await expect(
        panel(page).getByRole('heading', { name: 'Industrial Project (Mobile App Development)' }),
      ).toBeVisible();
    });
  });
});
