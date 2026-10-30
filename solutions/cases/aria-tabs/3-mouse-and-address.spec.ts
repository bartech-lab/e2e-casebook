import { test } from '../fixtures.ts';
import { expect } from '@playwright/test';
import { openTabs, panel, tab } from './helpers.ts';

test('a clicked tab is in the address, survives a reload, and a link with a hash opens that tab', async ({ page, sandbox }) => {
  await openTabs(page, sandbox);
  await tab(page, 'Specifications').click();
  await expect(panel(page)).toContainText('Weight 620 g');
  await expect(page).toHaveURL(/#specs$/);

  await page.reload();
  await expect(tab(page, 'Specifications')).toHaveAttribute('aria-selected', 'true');
  await expect(panel(page)).toContainText('Weight 620 g');

  await page.goto(page.url().replace(/#.*$/, '#shipping'));
  await page.reload();
  await expect(tab(page, 'Shipping')).toHaveAttribute('aria-selected', 'true');
  await expect(panel(page)).toContainText('Free returns');
});
