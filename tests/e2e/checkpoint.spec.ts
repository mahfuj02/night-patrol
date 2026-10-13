import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { stops } from '../../src/content';

const total = stops.length;
// EventFlow, the Exchange District warehouses, is a drive-by stop with a side panel. The RRC campus
// before it is a station (see station.spec.ts), and the stop after it has no panel yet.
const warehouses = stops.findIndex((s) => s.id === 'exchange-warehouses');
const panel = (page: Page) => page.getByRole('complementary', { name: 'EventFlow' });
const status = (page: Page) =>
  page.getByRole('navigation', { name: 'Patrol controls' }).getByRole('status');

// The low tier: these tests are about the panel, not the looks, and it is the cheapest to render.
async function driveToWarehouses(page: Page) {
  await page.goto('/?quality=low');
  await expect(page.locator('canvas')).toBeVisible();
  for (let i = 0; i < warehouses; i++) await page.keyboard.press('PageDown');
  await expect(status(page)).toContainText(`Stop ${warehouses + 1} of ${total}`);
}

test.describe('checkpoint panel', () => {
  test('opens at the Exchange District warehouses with EventFlow and the radio caption', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto('/?quality=low');
    await expect(page.locator('canvas')).toBeVisible();
    await expect(panel(page)).toBeHidden();
    await driveToWarehouses(page);
    await expect(panel(page)).toBeVisible();
    await expect(panel(page)).toContainText('Scoped ticketing and CRM platform for events.');
    await expect(panel(page)).toContainText('Stripe Checkout');
    await expect(panel(page).getByRole('link', { name: /GitHub repository/ })).toHaveAttribute(
      'href',
      'https://github.com/mahfuj02/eventflow',
    );
    await expect(panel(page).getByRole('link', { name: /Case study/ })).toHaveAttribute(
      'href',
      'https://mahfuj.dev/projects/eventflow',
    );
    await expect(panel(page).getByRole('link', { name: /Live site/ })).toHaveAttribute(
      'href',
      /^https:\/\//,
    );
    await expect(page.getByRole('region', { name: 'Dispatch radio' })).toContainText(
      'Tickets running through EventFlow, on your left.',
    );
  });

  test('Escape closes it and stays closed; driving on and back opens it again', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await driveToWarehouses(page);
    await expect(panel(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel(page)).toBeHidden();
    await page.keyboard.press('PageDown');
    await expect(status(page)).toContainText(`Stop ${warehouses + 2} of ${total}`);
    await expect(panel(page)).toBeHidden();
    await page.keyboard.press('PageUp');
    await expect(panel(page)).toBeVisible();
  });

  test('the close button works with the keyboard and hands focus back to Next stop', async ({
    page,
  }) => {
    await driveToWarehouses(page);
    await expect(panel(page)).toBeVisible();
    await page.getByRole('button', { name: 'Close checkpoint' }).focus();
    await page.keyboard.press('Enter');
    await expect(panel(page)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Next stop ›' })).toBeFocused();
  });

  test('has no serious accessibility violations while open', async ({ page }) => {
    test.setTimeout(150_000);
    await driveToWarehouses(page);
    await expect(panel(page)).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
    ).toEqual([]);
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 800 } });

    test('is a bottom sheet inside the screen, above the drive buttons', async ({ page }) => {
      await driveToWarehouses(page);
      await expect(panel(page)).toBeVisible();
      const sheet = await panel(page).boundingBox();
      const next = await page.getByRole('button', { name: 'Next stop ›' }).boundingBox();
      expect(sheet).not.toBeNull();
      expect(sheet!.x).toBeGreaterThanOrEqual(0);
      expect(sheet!.x + sheet!.width).toBeLessThanOrEqual(390);
      expect(sheet!.y + sheet!.height).toBeLessThanOrEqual(next!.y + 1);
    });
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('appears at the stop without sliding', async ({ page }) => {
      await page.goto('/?quality=low');
      await expect(page.locator('canvas')).toBeVisible();
      for (let i = 0; i < warehouses; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(600);
      }
      await expect(panel(page)).toBeVisible();
      const property = await panel(page).evaluate((el) => getComputedStyle(el).transitionProperty);
      expect(property).toBe('none');
    });
  });
});
