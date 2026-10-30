import { test } from '../fixtures.ts';
import { expect } from '@playwright/test';
import { openTabs, panel, tab, tablist } from './helpers.ts';

test('the accessibility tree names the selected tab and its panel, and only it is focusable', async ({ page, sandbox }) => {
  await openTabs(page, sandbox);
  await tab(page, 'Reviews').click();
  await expect(tablist(page)).toMatchAriaSnapshot(`
    - tablist "Product details":
      - tab "Description"
      - tab "Specifications"
      - tab "Reviews" [selected]
      - tab "Shipping"
  `);
  await expect(page.getByRole('tabpanel', { name: 'Reviews' })).toBeVisible();
  await expect(page.getByRole('tabpanel')).toHaveCount(1);
  await expect(tab(page, 'Reviews')).toHaveAttribute('aria-controls', (await panel(page).getAttribute('id'))!);

  const tabIndexes = await tablist(page).getByRole('tab').evaluateAll((tabs) => tabs.map((t) => (t as HTMLElement).tabIndex));
  expect(tabIndexes).toEqual([-1, -1, 0, -1]);
});
