import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { projects, stops } from '../../src/content';

const total = stops.length;
const status = (page: Page) =>
  page.getByRole('navigation', { name: 'Patrol controls' }).getByRole('status');
const radio = (page: Page) => page.getByRole('region', { name: 'Dispatch radio' });

// The low tier: these tests are about the words, not the looks, and it is the cheapest to render.
async function driveTo(page: Page, stopId: string) {
  const index = stops.findIndex((s) => s.id === stopId);
  await page.goto('/?quality=low');
  await expect(page.locator('canvas')).toBeVisible();
  for (let i = 0; i < index; i++) await page.keyboard.press('PageDown');
  await expect(status(page)).toContainText(`Stop ${index + 1} of ${total}`);
}

test.describe('project signs at drive-by stops', () => {
  for (const [stopId, caption] of [
    ['exchange-warehouses', 'Tickets running through EventFlow, on your left.'],
    ['city-services', 'City services building on your left.'],
  ] as const) {
    test(`${stopId}: the caption and the sign text are announced, and no panel pops up`, async ({
      page,
    }) => {
      test.setTimeout(120_000);
      const project = projects.find((p) => p.stopId === stopId)!;
      await driveTo(page, stopId);
      await expect(radio(page)).toContainText(caption);
      await expect(radio(page)).toContainText(
        `Sign: ${project.sign!.name}. ${project.sign!.slogan}`,
      );
      await expect(page.getByRole('complementary')).toHaveCount(0);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test('the project details are still one click away in the route map', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/?quality=low');
    await expect(page.locator('canvas')).toBeVisible();
    await page
      .getByRole('navigation', { name: 'Route map' })
      .getByRole('button', { name: 'CivicTrack' })
      .click();
    const details = page.getByRole('complementary', { name: 'CivicTrack' });
    await expect(details).toContainText('311-style civic service request tracker.');
    await expect(details.getByRole('link', { name: /GitHub repository/ })).toHaveAttribute(
      'href',
      'https://github.com/mahfuj02/civictrack',
    );
  });
});
