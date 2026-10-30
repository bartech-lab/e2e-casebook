import { expect, join, test } from '../fixtures.ts';
import { createCardInDialog, createCardInline, expectCreated } from './helpers.ts';

const variants = ['inline', 'dialog'] as const;
const other = (v: (typeof variants)[number]) => (v === 'inline' ? 'dialog' : 'inline');

for (const variant of variants) {
  test(`the server pin wins over a stored ${other(variant)} assignment (${variant})`, async ({ page, request, sandbox }) => {
    expect((await request.post(`/__test__/s/${sandbox.id}/flags`, { data: { createCard: variant } })).ok()).toBe(true);
    await page.addInitScript((v) => localStorage.setItem('variant:createCard', v), other(variant));
    await join(page, sandbox, 'alice', 'board');
    await expect(page.locator(`[data-variant="${variant}"]`)).toBeVisible();
    if (variant === 'inline') await createCardInline(page, `Pinned ${variant}`);
    else await createCardInDialog(page, `Pinned ${variant}`);
    await expectCreated(page, `Pinned ${variant}`);
  });

  test(`a stored ${variant} assignment wins over a fresh draw of ${other(variant)}`, async ({ page, request, sandbox }) => {
    expect((await request.post(`/__test__/s/${sandbox.id}/flags`, { data: { draw: other(variant) } })).ok()).toBe(true);
    await page.addInitScript((v) => localStorage.setItem('variant:createCard', v), variant);
    await join(page, sandbox, 'alice', 'board');
    await expect(page.locator(`[data-variant="${variant}"]`)).toBeVisible();
  });
}
