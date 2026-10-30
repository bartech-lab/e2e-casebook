import { expect, join, test } from '../fixtures.ts';
import { createCardInline, expectCreated } from './helpers.ts';

test('create a card with the inline variant only (the one most users see)', async ({ page, request, sandbox }) => {
  expect((await request.post(`/__test__/s/${sandbox.id}/flags`, { data: { createCard: 'inline' } })).ok()).toBe(true);
  await join(page, sandbox, 'alice', 'board');
  await createCardInline(page, 'Inline only');
  await expectCreated(page, 'Inline only');
});
