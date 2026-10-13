import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { communityNotes, experience, profile, projects } from '../../src/content';

test.describe('/simple', () => {
  test('renders all content', async ({ page }) => {
    await page.goto('/simple');
    await expect(page).toHaveTitle(/Mahfuj/);
    await expect(page.getByRole('heading', { level: 1, name: profile.name })).toBeVisible();
    for (const project of projects) {
      await expect(page.getByRole('heading', { level: 3, name: project.name })).toBeVisible();
    }
    for (const entry of experience) {
      await expect(page.getByRole('heading', { level: 3, name: entry.title })).toBeVisible();
    }
    for (const link of communityNotes.flatMap((n) => n.links)) {
      await expect(page.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);
    }
  });

  test('has ordered headings with a single h1', async ({ page }) => {
    await page.goto('/simple');
    const levels = await page
      .locator('h1, h2, h3, h4')
      .evaluateAll((els) => els.map((el) => Number(el.tagName.slice(1))));
    expect(levels.filter((l) => l === 1)).toHaveLength(1);
    levels.forEach((level, i) => {
      if (i > 0) expect(level - levels[i - 1]!).toBeLessThanOrEqual(1);
    });
  });

  test('keyboard: skip link is first and moves focus to main content', async ({ page }) => {
    await page.goto('/simple');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('links the resume and exposes no phone number', async ({ page }) => {
    await page.goto('/simple');
    await expect(page.getByRole('link', { name: /Download resume/ })).toHaveAttribute(
      'href',
      profile.resumeUrl,
    );
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  });

  test('has no horizontal scroll on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto('/simple');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('has no accessibility violations (axe)', async ({ page }) => {
    await page.goto('/simple');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test('has canonical link and Person JSON-LD', async ({ page }) => {
    await page.goto('/simple');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/simple$/);
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    expect(JSON.parse(ld!)['@type']).toBe('Person');
  });
});

test.describe('seo files', () => {
  test('serves robots.txt and sitemap.xml', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.ok()).toBe(true);
    expect(await robots.text()).toContain('Sitemap:');
    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).toContain('/simple');
  });
});

test('home links to /simple', async ({ page }) => {
  await page.goto('/?quality=low');
  await page.getByRole('link', { name: 'Simple view' }).click();
  await expect(page).toHaveURL(/\/simple$/);
});
