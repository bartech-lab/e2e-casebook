import { column, expect, join, moveCard, test } from '../fixtures.ts';

test('a slow failure rolls back only its own card', async ({ page, sandbox }) => {
  await sandbox.fault({ http: [{ method: 'PATCH', path: 'cards/1', status: 500, delayMs: 800 }] });
  await join(page, sandbox, 'alice', 'board');
  await moveCard(page, 'Write the release notes', 'Doing');
  await moveCard(page, 'Fix the login redirect', 'Done');
  await expect(column(page, 'Done')).toContainText(['Fix the login redirect']);

  await expect(page.getByRole('alert')).toHaveText(/Could not move “Write the release notes”/);
  await expect(column(page, 'To do')).toContainText(['Write the release notes']);
  await expect(column(page, 'Done')).toContainText(['Fix the login redirect']);
  await expect(page.getByRole('alert')).toHaveCount(1);
  expect((await sandbox.card(2)).status).toBe('done');
});

test('when the first of two moves of one card fails last, the card keeps the second move', async ({
  page,
  sandbox,
}) => {
  await sandbox.fault({ http: [{ method: 'PATCH', path: 'cards/1', status: 500, delayMs: 800 }] });
  await join(page, sandbox, 'alice', 'board');
  await moveCard(page, 'Write the release notes', 'Doing');
  await moveCard(page, 'Write the release notes', 'Done');

  await expect(page.getByRole('alert')).toHaveText(/Could not move “Write the release notes” to Doing/);
  await expect(column(page, 'Done')).toContainText(['Write the release notes']);
  await expect(column(page, 'To do')).not.toContainText(['Write the release notes']);
  expect((await sandbox.card(1)).status).toBe('done');
});
