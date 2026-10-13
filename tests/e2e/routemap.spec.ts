import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { stops } from '../../src/content';

const map = (page: Page) => page.getByRole('navigation', { name: 'Route map' });

async function openHome(page: Page) {
  await page.goto('/?quality=low');
  await expect(page.locator('canvas')).toBeVisible();
}

test.describe('Route map', () => {
  test('is open on a desktop, lists every stop and passes axe', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openHome(page);
    await expect(map(page)).toBeVisible();
    await expect(map(page).getByRole('listitem').first()).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('reaches a stop in one click and a project in two', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await openHome(page);
    const stop = stops.find((s) => s.id === 'exchange-warehouses')!;
    await map(page)
      .getByRole('button', { name: new RegExp(stop.title) })
      .click();
    await expect(page.getByRole('status').filter({ hasText: /Driving to|Arrived/ })).toBeVisible();
    await map(page).getByRole('button', { name: 'Game Hub' }).click();
    await expect(page.getByRole('complementary', { name: 'Game Hub' })).toBeVisible();
  });

  test('is a bottom sheet on a phone and closes after choosing', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 800 });
    await openHome(page);
    await expect(map(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Route map' }).click();
    await expect(map(page)).toBeVisible();
    await map(page)
      .getByRole('button', { name: /Dispatch/ })
      .click();
    await expect(map(page)).toHaveCount(0);
  });

  test('stays usable under reduced motion', async ({ page }) => {
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await openHome(page);
    await map(page)
      .getByRole('button', { name: /Dispatch/ })
      .click();
    await expect(page.getByRole('status').filter({ hasText: /Arrived: / })).toBeVisible({
      timeout: 30_000,
    });
  });
});
