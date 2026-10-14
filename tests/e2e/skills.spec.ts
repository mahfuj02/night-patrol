import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// A software renderer draws only a frame or two a second, so give driving there, turning in and
// backing out plenty of real time.
const MANEUVER = 150_000;

const panel = (page: Page) => page.getByRole('complementary', { name: 'Skills' });
const map = (page: Page) => page.getByRole('navigation', { name: 'Route map' });

/** Opens the Skills station from the route map: the car drives there, turns right and parks. */
async function openSkills(page: Page) {
  await page.goto('/?quality=low&intro=off');
  await expect(page.locator('canvas')).toBeVisible();
  if (!(await map(page).isVisible())) await page.getByRole('button', { name: 'Route map' }).click();
  await map(page)
    .getByRole('button', { name: /Skills station/ })
    .click();
  await expect(panel(page)).toBeVisible({ timeout: MANEUVER });
}

test.describe('Skills station', () => {
  test('parks on the right, lists the skills with levels as text, and has no axe violations', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openSkills(page);
    await expect(panel(page).getByRole('heading', { name: 'Backend' })).toBeVisible();
    await expect(panel(page).getByText('TypeScript').locator('..')).toContainText('Level 4 of 5');
    await expect(panel(page).getByText('Theme performance at LIILAB')).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Skills station opened' })).toHaveCount(
      1,
    );
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Escape leaves the station and the car backs out', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openSkills(page);
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden({ timeout: MANEUVER });
  });

  test('is a bottom sheet on a phone', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await openSkills(page);
    const box = await panel(page).boundingBox();
    const next = await page.getByRole('button', { name: 'Next stop ›' }).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    expect(box!.y + box!.height).toBeLessThanOrEqual(next!.y + 1);
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('cuts straight to the Skills station', async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize({ width: 1280, height: 800 });
      await openSkills(page);
      await expect(panel(page).getByRole('heading', { name: 'Mobile' })).toBeVisible();
    });
  });
});
