import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { stops } from '../../src/content';

// The software renderer can be slow to draw its first frames, so allow time for Start Patrol.
const READY = 60_000;
const total = stops.length;

const screen = (page: Page) => page.getByTestId('loading-screen');
const start = (page: Page) => page.getByRole('button', { name: 'Start Patrol' });

test.describe('Ignition loading screen', () => {
  test('shows the fuel gauge, then Start Patrol, and has no axe violations', async ({ page }) => {
    await page.goto('/?quality=low');
    await expect(screen(page)).toBeVisible();
    await expect(page.getByRole('progressbar', { name: /Fuel/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Skip to simple view' })).toBeVisible();
    await expect(start(page)).toBeVisible({ timeout: READY });
    await expect(start(page)).toBeFocused();
    await expect(page.getByRole('progressbar', { name: /Fuel/ })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('keeps the drive out of reach until it starts, then pulls out to Dispatch', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto('/?quality=low');
    await expect(start(page)).toBeVisible({ timeout: READY });
    // The controls behind the screen are inert and the keys do not drive the car.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('PageDown');
    await start(page).press('Enter');
    await expect(screen(page)).toBeHidden();
    await expect(
      page.getByRole('navigation', { name: 'Patrol controls' }).getByRole('status'),
    ).toContainText(`Stop 2 of ${total}: ${stops[1]!.title}`, { timeout: 60_000 });
    await expect(page.getByRole('button', { name: 'Next stop ›' })).toBeFocused();
  });

  test('the skip link goes to the simple version', async ({ page }) => {
    await page.goto('/?quality=low');
    await page.getByRole('link', { name: 'Skip to simple view' }).click();
    await expect(page).toHaveURL(/\/simple$/);
  });

  test('?intro=off skips it', async ({ page }) => {
    await page.goto('/?quality=low&intro=off');
    await expect(page.locator('canvas')).toBeVisible();
    await expect(screen(page)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Next stop ›' })).toBeVisible();
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('cuts away at once when Start Patrol is pressed', async ({ page }) => {
      test.setTimeout(120_000);
      await page.goto('/?quality=low');
      await expect(start(page)).toBeVisible({ timeout: READY });
      await start(page).click();
      await expect(screen(page)).toBeHidden({ timeout: 5_000 });
    });
  });
});
