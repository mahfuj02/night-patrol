import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { stops } from '../../src/content';

// The stop announcement lives in the drive controls; the radio region has the caption and the sign text.
const status = (page: Page) =>
  page.getByRole('navigation', { name: 'Patrol controls' }).getByRole('status');
const total = stops.length;

// Behaviour tests run on the low tier: they are about navigation, not looks, and the low tier
// avoids post-processing, which is slow on the software renderer the CI runners use. The high and
// medium tiers have their own render and accessibility checks below.
async function openHome(page: Page, tier: 'high' | 'medium' | 'low' = 'low') {
  await page.goto(`/?quality=${tier}`);
  await expect(page.locator('canvas')).toBeVisible();
}

/** Counts the WebGL draw calls the page makes, from before it loads. */
async function countDrawCalls(page: Page) {
  await page.addInitScript(() => {
    const counter = { calls: 0 };
    (window as unknown as { __draws: typeof counter }).__draws = counter;
    const proto = WebGL2RenderingContext.prototype;
    for (const name of [
      'drawElements',
      'drawArrays',
      'drawElementsInstanced',
      'drawArraysInstanced',
    ] as const) {
      const original = proto[name] as (...args: unknown[]) => void;
      (proto as unknown as Record<string, unknown>)[name] = function (...args: unknown[]) {
        counter.calls++;
        return original.apply(this, args);
      };
    }
  });
}

/** Draw calls in one frame, averaged over a few frames. */
function drawCallsPerFrame(page: Page) {
  return page.evaluate(async () => {
    const counter = (window as unknown as { __draws: { calls: number } }).__draws;
    const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await frame();
    const before = counter.calls;
    for (let i = 0; i < 3; i++) await frame();
    return (counter.calls - before) / 3;
  });
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
    // At the end the Next button becomes New patrol (see shift.spec.ts).
    await expect(page.getByRole('button', { name: 'New patrol ›' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next stop ›' })).toHaveCount(0);
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

  test('has no serious accessibility violations (high tier, with post-processing)', async ({
    page,
  }) => {
    // The high tier draws post-processing on a software renderer, which gets slower as the scene
    // grows, and axe has to wait for it.
    test.setTimeout(150_000);
    await openHome(page, 'high');
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
      await countDrawCalls(page);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`/?quality=${tier}`);
      await expect(page.locator('canvas')).toBeVisible();
      await expect(status(page)).toContainText(`Stop 1 of ${total}`);
      await page.waitForTimeout(1500);
      expect(errors).toEqual([]);
      // Something is drawn on every tier. (A render loop taken over by a positive useFrame priority
      // draws nothing on the low tier, which has no post-processing to render for it.)
      expect(await drawCallsPerFrame(page)).toBeGreaterThan(10);
    });
  }
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('one wheel gesture moves exactly one stop', async ({ page }) => {
    await openHome(page);
    // Two wheel events in the same task, so they are always inside the step cooldown however
    // slow the machine is. Only the first may move a stop.
    await page.evaluate(() => {
      const container = document.querySelector('canvas')!.closest('[aria-hidden="true"]')!;
      for (let i = 0; i < 2; i++) {
        container.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }));
      }
    });
    await expect(status(page)).toContainText(`Stop 2 of ${total}`);
    await page.waitForTimeout(300);
    await expect(status(page)).toContainText(`Stop 2 of ${total}`);

    // After the cooldown, the next gesture moves the next stop.
    await page.waitForTimeout(600);
    await page.mouse.move(400, 300);
    await page.mouse.wheel(0, 100);
    await expect(status(page)).toContainText(`Stop 3 of ${total}`);
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
