import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Only the shell is scanned: several case pages ship accessibility defects on purpose.
const scan = async (page: Page, include?: string) => {
  const builder = new AxeBuilder({ page });
  if (include) builder.include(include);
  const { violations } = await builder.analyze();
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem('e2e-casebook:theme', t), theme);
    });

    test('the landing page has no axe violations', async ({ page }) => {
      await page.goto('/');
      expect(await scan(page)).toEqual([]);
      await page.getByRole('button', { name: 'All cases' }).click();
      await page.getByRole('list', { name: 'Topics' }).getByRole('button').first().click();
      expect(await scan(page)).toEqual([]);
    });

    test('the landing page has no axe violations at 390 px', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/');
      expect(await scan(page)).toEqual([]);
    });

    test('the sandbox navigation has no axe violations', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Try case 1', exact: true }).click();
      await page.getByLabel('Your name').fill('axe');
      await page.getByRole('button', { name: 'Join' }).click();
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
      expect(await scan(page, 'nav.sandbox-nav')).toEqual([]);
    });
  });
}
