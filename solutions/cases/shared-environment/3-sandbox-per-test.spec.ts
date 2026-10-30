import { expect, test } from '../fixtures.ts';
import { createCard, openBoard } from './helpers.ts';

test('create "Release checklist" in a sandbox of its own and count the cards', async ({ page, sandbox }) => {
  await openBoard(page, sandbox);
  await createCard(page, 'Release checklist');
  await expect(page.getByTestId('card-count')).toHaveText('5 cards');
});
