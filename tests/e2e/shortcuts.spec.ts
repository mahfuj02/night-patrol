import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('keyboard shortcuts overlay', () => {
  test('opens with ?, passes axe, and closes with Escape', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/?quality=low&intro=off');
    await expect(page.locator('canvas')).toBeVisible();
    await page.keyboard.press('?');
    const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Brake to a stop')).toBeVisible();
    const results = await new AxeBuilder({ page }).include('[role=dialog]').analyze();
    expect(results.violations).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('is reachable by mouse from the ? button', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/?quality=low&intro=off');
    await page.getByRole('button', { name: 'Keyboard shortcuts' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
