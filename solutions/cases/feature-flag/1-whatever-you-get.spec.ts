import { join, test } from '../fixtures.ts';
import { createCardInDialog, createCardInline, expectCreated } from './helpers.ts';

test('create a card with whichever variant this visitor is assigned', async ({ page, sandbox }) => {
  await join(page, sandbox, 'alice', 'board');
  const inline = page.getByLabel('New card title');
  const dialogButton = page.getByRole('button', { name: 'New card' });
  await inline.or(dialogButton).first().waitFor();
  if (await inline.isVisible()) await createCardInline(page, 'Flag-agnostic card');
  else await createCardInDialog(page, 'Flag-agnostic card');
  await expectCreated(page, 'Flag-agnostic card');
});
