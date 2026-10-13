import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/?quality=low');
  await expect(page).toHaveTitle(/Night Patrol/);
  await expect(page.getByRole('heading', { level: 1, name: 'Night Patrol' })).toBeVisible();
});

test('home page has no serious accessibility violations', async ({ page }) => {
  await page.goto('/?quality=low');
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious).toEqual([]);
});
