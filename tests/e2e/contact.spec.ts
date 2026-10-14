import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// A software renderer draws only a frame or two a second, so give driving there, turning in and
// backing out plenty of real time.
const MANEUVER = 150_000;

const panel = (page: Page) => page.getByRole('complementary', { name: 'Contact' });
const map = (page: Page) => page.getByRole('navigation', { name: 'Route map' });

/** Opens the Contact station from the route map: the car drives to The Forks, turns right and parks. */
async function openContact(page: Page) {
  await page.goto('/?quality=low&intro=off');
  await expect(page.locator('canvas')).toBeVisible();
  if (!(await map(page).isVisible())) await page.getByRole('button', { name: 'Route map' }).click();
  await map(page)
    .getByRole('button', { name: /The Forks/ })
    .click();
  await expect(panel(page)).toBeVisible({ timeout: MANEUVER });
}

test.describe('Contact station', () => {
  test('parks at the market and shows the contact links, with no axe violations', async ({
    page,
  }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openContact(page);
    await expect(
      panel(page).getByRole('link', { name: 'ahmedmahfujsy@gmail.com' }),
    ).toHaveAttribute('href', 'mailto:ahmedmahfujsy@gmail.com');
    await expect(panel(page).getByRole('link', { name: 'Download resume (PDF)' })).toHaveAttribute(
      'href',
      'https://mahfuj.dev/resume/MahfujAhmed_Resume.pdf',
    );
    await expect(page.getByRole('region', { name: 'Dispatch radio' })).toContainText(
      'Shift complete.',
    );
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('Escape leaves the station and the car backs out', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openContact(page);
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden({ timeout: MANEUVER });
  });

  test('is a bottom sheet on a phone', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await openContact(page);
    const box = await panel(page).boundingBox();
    const prev = await page.getByRole('button', { name: '‹ Prev' }).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    expect(box!.y + box!.height).toBeLessThanOrEqual(prev!.y + 1);
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('cuts straight to the market', async ({ page }) => {
      test.setTimeout(300_000);
      await page.setViewportSize({ width: 1280, height: 800 });
      await openContact(page);
      await expect(panel(page).getByRole('link', { name: 'Download resume (PDF)' })).toBeVisible();
    });
  });
});
