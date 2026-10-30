import { expect, join, test } from '../fixtures.ts';
import { createCardInDialog, createCardInline, expectCreated } from './helpers.ts';

for (const variant of ['inline', 'dialog'] as const) {
  test(`create a card with the ${variant} variant, pinned through the flags hook`, async ({ page, request, sandbox }) => {
    expect((await request.post(`/__test__/s/${sandbox.id}/flags`, { data: { createCard: variant } })).ok()).toBe(true);
    await join(page, sandbox, 'alice', 'board');
    await expect(page.locator(`[data-variant="${variant}"]`)).toBeVisible();
    if (variant === 'inline') await createCardInline(page, `Pinned ${variant}`);
    else await createCardInDialog(page, `Pinned ${variant}`);
    await expectCreated(page, `Pinned ${variant}`);
  });
}
