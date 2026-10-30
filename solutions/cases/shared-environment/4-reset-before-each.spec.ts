import { expect, test } from '../fixtures.ts';
import { createCard, openBoard } from './helpers.ts';

test.beforeEach(async ({ shared }) => {
  await shared.reset();
});

test('reset the shared sandbox, then create "Release checklist" and count @naive', async ({ page, shared }) => {
  await openBoard(page, shared);
  await createCard(page, 'Release checklist');
  await expect(page.getByTestId('card-count')).toHaveText('5 cards');
});
