import { expect, test } from '../fixtures.ts';
import { createCard, openBoard } from './helpers.ts';

test('create "Release checklist" in the shared sandbox and count the cards @naive', async ({ page, shared }) => {
  await openBoard(page, shared);
  await createCard(page, 'Release checklist');
  await expect(page.getByTestId('card-count')).toHaveText('5 cards');
});
