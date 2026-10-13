import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// A software renderer draws only a frame or two a second, and a manoeuvre advances by at most 0.1 s
// of game time per frame, so give driving there and turning in plenty of real time.
const MANEUVER = 150_000;

const panel = (page: Page) => page.getByRole('complementary', { name: 'Projects' });
const map = (page: Page) => page.getByRole('navigation', { name: 'Route map' });

/** Opens the library from the route map: the car drives there and parks, then the panel appears. */
async function openLibrary(page: Page) {
  await page.goto('/?quality=low');
  await expect(page.locator('canvas')).toBeVisible();
  if (!(await map(page).isVisible())) await page.getByRole('button', { name: 'Route map' }).click();
  await map(page)
    .getByRole('button', { name: /Millennium Library/ })
    .click();
  await expect(panel(page)).toBeVisible({ timeout: MANEUVER });
}

test.describe('Millennium Library', () => {
  test('parks at the library, searches the catalog and opens a book', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openLibrary(page);
    await expect(panel(page).getByRole('status')).toHaveText('7 books');

    await panel(page).getByRole('searchbox', { name: 'Search the catalog' }).fill('react native');
    await expect(panel(page).getByRole('status')).toHaveText('2 books');
    await panel(page).getByRole('button', { name: 'Systems' }).click();
    await expect(panel(page).getByText('No books match.')).toBeVisible();
    await panel(page).getByRole('button', { name: 'All' }).click();
    await panel(page).getByRole('searchbox').fill('');

    await panel(page).getByRole('button', { name: 'WEB-01 EventFlow' }).click();
    await expect(panel(page).getByRole('heading', { name: 'Book: EventFlow' })).toBeFocused();
    await expect(
      panel(page).getByText("Book your ticket. Tonight's show starts here."),
    ).toBeVisible();
    await expect(panel(page).getByRole('img', { name: /EventFlow home page/ })).toBeVisible();
    await expect(panel(page).getByRole('link', { name: /Source/ })).toHaveAttribute(
      'href',
      'https://github.com/mahfuj02/eventflow',
    );
    await expect(panel(page).getByRole('button', { name: /Drive to it/ })).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(panel(page).getByRole('button', { name: 'WEB-01 EventFlow' })).toBeFocused();
    await expect(panel(page)).toBeVisible();
  });

  test('Drive to it leaves the library and drives to the project', async ({ page }) => {
    test.setTimeout(300_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openLibrary(page);
    await panel(page).getByRole('button', { name: 'AI-01 RoleReady' }).click();
    await panel(page)
      .getByRole('button', { name: /Drive to it/ })
      .click();
    await expect(panel(page)).toBeHidden({ timeout: MANEUVER });
    await expect(page.getByRole('region', { name: 'Dispatch radio' })).toContainText(
      'Sign: RoleReady',
      { timeout: MANEUVER },
    );
  });

  test('is a bottom sheet on a phone with the shelf and the book view', async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await openLibrary(page);
    const box = await panel(page).boundingBox();
    const next = await page.getByRole('button', { name: 'Next stop ›' }).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
    expect(box!.y + box!.height).toBeLessThanOrEqual(next!.y + 1);
    await panel(page).getByRole('button', { name: 'MOB-01 Safe Drive AI' }).click();
    await expect(panel(page).getByText('Concept design')).toBeVisible();
    await expect(panel(page).getByRole('button', { name: /Drive to it/ })).toBeVisible();
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('cuts straight to the library and the panel works', async ({ page }) => {
      test.setTimeout(240_000);
      await page.setViewportSize({ width: 1280, height: 800 });
      await openLibrary(page);
      await panel(page).getByRole('button', { name: 'WEB-03 Game Hub' }).click();
      await expect(panel(page).getByText('Call number WEB-03')).toBeVisible();
      await expect(panel(page).getByRole('button', { name: /Drive to it/ })).toHaveCount(0);
    });
  });
});
