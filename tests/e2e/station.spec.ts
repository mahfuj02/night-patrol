import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { stations, stops } from '../../src/content';

const total = stops.length;
const education = stations[0]!;
const rrc = stops.findIndex((s) => s.id === education.stopId);
const status = (page: Page) =>
  page.getByRole('navigation', { name: 'Patrol controls' }).getByRole('status');
const openButton = (page: Page) => page.getByRole('button', { name: 'Open Education' });
const wall = (page: Page) =>
  page.getByRole('region', { name: 'Diploma in Full Stack Web Development' });

// A software renderer draws only a frame or two a second, and a manoeuvre advances by at most 0.1 s
// of game time per frame, so give turning in and backing out plenty of real time.
const MANEUVER = 90_000;

async function openHome(page: Page) {
  await page.goto('/?quality=low&intro=off');
  await expect(page.locator('canvas')).toBeVisible();
}

/** Drives to the RRC campus stop, where the Education station can be opened. */
async function driveToRrc(page: Page) {
  await openHome(page);
  for (let i = 0; i < rrc; i++) await page.keyboard.press('PageDown');
  await expect(status(page)).toContainText(`Stop ${rrc + 1} of ${total}`);
}

async function park(page: Page) {
  await driveToRrc(page);
  await openButton(page).click();
  await expect(wall(page)).toBeVisible({ timeout: MANEUVER });
}

test.describe('Education station', () => {
  test('shows an Open Education button at the red light, and no button before it', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await openHome(page);
    await expect(openButton(page)).toHaveCount(0);
    // Dispatch, then three steps along the road to the light before the campus.
    await page.keyboard.press('PageDown');
    await expect(status(page)).toContainText('Stop 2 of');
    await expect(openButton(page)).toHaveCount(0);
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
    await expect(openButton(page)).toBeVisible();
    // Driving on is never blocked: another step and the car is at the stop (where it can still open).
    await page.keyboard.press('PageDown');
    await expect(status(page)).toContainText(`Stop ${rrc + 1} of ${total}`);
    await expect(openButton(page)).toBeVisible();
  });

  test('parks, shows the diploma on the wall, and backs out with Escape', async ({ page }) => {
    test.setTimeout(240_000);
    await park(page);
    await expect(wall(page)).toContainText('Red River College Polytechnic');
    await expect(wall(page)).toContainText('Aug 2023');
    await expect(wall(page)).toContainText('Sprint-Innovation 2025: Winner');
    // The radio line stays as a caption.
    await expect(
      page.getByRole('status').filter({ hasText: 'Education station opened' }),
    ).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(wall(page)).toBeHidden({ timeout: MANEUVER });
    await expect(openButton(page)).toBeVisible({ timeout: MANEUVER });
  });

  test('driving on from the station backs out and carries on to the next stop', async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await park(page);
    await page.keyboard.press('PageDown');
    await expect(status(page)).toContainText(`Stop ${rrc + 2} of ${total}`, { timeout: MANEUVER });
    await expect(wall(page)).toBeHidden();
  });

  test('has no serious accessibility violations while parked', async ({ page }) => {
    test.setTimeout(240_000);
    await park(page);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'),
    ).toEqual([]);
  });

  test('does not take focus when it opens, and the Open button follows the drive controls', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await driveToRrc(page);
    await page.getByRole('button', { name: 'Start over' }).focus();
    await page.keyboard.press('Tab');
    await expect(openButton(page)).toBeFocused();
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 800 } });

    test('opens the content in the bottom sheet too, because the wall is too small to read', async ({
      page,
    }) => {
      test.setTimeout(240_000);
      await driveToRrc(page);
      await openButton(page).click();
      const sheet = page.getByRole('complementary', {
        name: 'Diploma in Full Stack Web Development',
      });
      await expect(sheet).toBeVisible({ timeout: MANEUVER });
      // One copy for assistive technology: the wall region is not exposed.
      await expect(wall(page)).toHaveCount(0);
      const box = await sheet.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(390);
      await page.getByRole('button', { name: 'Leave station' }).click();
      await expect(sheet).toBeHidden({ timeout: MANEUVER });
    });
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('cuts straight to the parked view, and back', async ({ page }) => {
      test.setTimeout(120_000);
      await openHome(page);
      for (let i = 0; i < rrc; i++) {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(600);
      }
      await openButton(page).click();
      await expect(wall(page)).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(wall(page)).toBeHidden();
      await expect(openButton(page)).toBeVisible();
    });
  });
});
