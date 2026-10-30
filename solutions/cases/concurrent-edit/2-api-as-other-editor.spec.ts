import { expect, join, test } from '../fixtures.ts';

test('a change made through the API turns my save into a conflict', async ({ page, sandbox }) => {
  await join(page, sandbox, 'bob', 'cards/1');
  await expect(page.getByLabel('Title')).toHaveValue('Write the release notes');
  expect(await sandbox.patchCard(1, { title: 'From the API', by: 'alice' })).toBe(200);

  await page.getByLabel('Title').fill('Bob title');
  await page.getByRole('button', { name: 'Save' }).click();
  const conflict = page.getByRole('alert', { name: 'Conflict' });
  await expect(conflict).toContainText('From the API');

  await conflict.getByRole('button', { name: 'Keep mine' }).click();
  await expect(page.getByRole('status')).toHaveText('Saved.');
  expect(await sandbox.card(1)).toMatchObject({ title: 'Bob title', version: 3 });
});
