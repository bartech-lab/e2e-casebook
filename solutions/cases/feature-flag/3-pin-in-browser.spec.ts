import { expect, join, test } from '../fixtures.ts';
import { createCardInDialog, createCardInline, expectCreated } from './helpers.ts';

for (const variant of ['inline', 'dialog'] as const) {
  test(`create a card with the ${variant} variant, assigned in localStorage`, async ({ page, sandbox }) => {
    await page.addInitScript((v) => localStorage.setItem('variant:createCard', v), variant);
    await join(page, sandbox, 'alice', 'board');
    await expect(page.locator(`[data-variant="${variant}"]`)).toBeVisible();
    if (variant === 'inline') await createCardInline(page, `Stored ${variant}`);
    else await createCardInDialog(page, `Stored ${variant}`);
    await expectCreated(page, `Stored ${variant}`);
  });
}
