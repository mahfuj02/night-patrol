import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { stops } from '../../src/content';

const status = (page: Page) => page.getByRole('status');
const total = stops.length;

async function openHome(page: Page) {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
}

test.describe('drive (WebGL)', () => {
  test('renders the 3D canvas without runtime errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await openHome(page);
    await expect(status(page)).toContainText(`Stop 1 of ${total}: ${stops[0]!.title}`);
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });

  test('the page itself does not scroll', async ({ page }) => {
    await openHome(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('keyboard drives between stops', async ({ page }) => {
    await openHome(page);
    await page.keyboard.press('PageDown');
    await expect(status(page)).toContainText(`Stop 2 of ${total}: ${stops[1]!.title}`);
    await page.keyboard.press('Space');
    await expect(status(page)).toContainText(`Stop 3 of ${total}: ${stops[2]!.title}`);
    await page.keyboard.press('PageUp');
    await expect(status(page)).toContainText(`Stop 2 of ${total}`);
    await page.keyboard.press('Shift+Space');
    await expect(status(page)).toContainText(`Stop 1 of ${total}`);
  });

  test('the wheel drives to the end of the route', async ({ page }) => {
    await openHome(page);
    await page.mouse.move(400, 300);
    for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 2000);
    await expect(status(page)).toContainText(
      `Stop ${total} of ${total}: ${stops[total - 1]!.title}`,
    );
    await expect(page.getByRole('button', { name: 'Next stop ›' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  test('Next and Prev buttons work with the mouse', async ({ page }) => {
    await openHome(page);
    await page.getByRole('button', { name: 'Next stop ›' }).click();
    await expect(status(page)).toContainText(`Stop 2 of ${total}`);
    await page.getByRole('button', { name: '‹ Prev' }).click();
    await expect(status(page)).toContainText(`Stop 1 of ${total}`);
  });

  test('keyboard users are not trapped: Tab reaches the link and buttons, Space acts once', async ({
    page,
  }) => {
    await openHome(page);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Simple view' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '‹ Prev' })).toBeFocused();
    await page.keyboard.press('Tab');
    const next = page.getByRole('button', { name: 'Next stop ›' });
    await expect(next).toBeFocused();
    await page.keyboard.press('Space');
    await expect(status(page)).toContainText(`Stop 2 of ${total}`);
    // Space on a focused button must not also trigger the global "next stop" shortcut.
    await page.waitForTimeout(200);
    await expect(status(page)).toContainText(`Stop 2 of ${total}`);
    await expect(next).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(status(page)).toContainText(`Stop 3 of ${total}`);
  });

  test('the simple-view link works from the keyboard', async ({ page }) => {
    await openHome(page);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/simple$/);
  });

  test('has no serious accessibility violations', async ({ page }) => {
    await openHome(page);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious).toEqual([]);
  });
});

test.describe('quality override', () => {
  for (const tier of ['high', 'medium', 'low']) {
    test(`?quality=${tier} renders without runtime errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`/?quality=${tier}`);
      await expect(page.locator('canvas')).toBeVisible();
      await expect(status(page)).toContainText(`Stop 1 of ${total}`);
      await page.waitForTimeout(500);
      expect(errors).toEqual([]);
    });
  }
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('one wheel gesture moves exactly one stop', async ({ page }) => {
    await openHome(page);
    await page.mouse.move(400, 300);
    await page.mouse.wheel(0, 100);
    await expect(status(page)).toContainText(`Stop 2 of ${total}`);
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(150);
    await expect(status(page)).toContainText(`Stop 2 of ${total}`);
  });

  test('arrow keys step between stops', async ({ page }) => {
    await openHome(page);
    await page.keyboard.press('ArrowDown');
    await expect(status(page)).toContainText(`Stop 2 of ${total}`);
  });
});

test.describe('no WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...rest: unknown[]
      ) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
        return original.call(this, type, ...(rest as []));
      } as typeof original;
    });
  });

  test('shows the simple-view prompt and no canvas', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/cannot show the 3D drive/)).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount(0);
    await page.getByRole('link', { name: 'View the simple version' }).click();
    await expect(page).toHaveURL(/\/simple$/);
  });

  test('has no serious accessibility violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/cannot show the 3D drive/)).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
    ).toEqual([]);
  });
});
