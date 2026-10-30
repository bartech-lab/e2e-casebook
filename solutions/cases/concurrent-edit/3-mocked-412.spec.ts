import { expect, join, test } from '../fixtures.ts';

test('the client shows a mocked 412 and retries with the version from it', async ({ page, sandbox }) => {
  const ifMatch: (string | undefined)[] = [];
  await page.route(/\/api\/s\/[a-z0-9]+\/cards\/1$/, async (route) => {
    if (route.request().method() !== 'PATCH') return route.continue();
    ifMatch.push(route.request().headers()['if-match']);
    if (ifMatch.length === 1) {
      return route.fulfill({
        status: 412,
        json: {
          error: 'version mismatch',
          current: { id: 1, title: 'Mallory title', description: '', status: 'todo', version: 7, updatedBy: 'mallory' },
        },
      });
    }
    return route.fulfill({
      json: { id: 1, title: 'Bob title', description: '', status: 'todo', version: 8, updatedBy: 'bob' },
    });
  });

  await join(page, sandbox, 'bob', 'cards/1');
  await page.getByLabel('Title').fill('Bob title');
  await page.getByRole('button', { name: 'Save' }).click();
  const conflict = page.getByRole('alert', { name: 'Conflict' });
  await expect(conflict).toContainText('mallory changed this card');
  await conflict.getByRole('button', { name: 'Keep mine' }).click();
  await expect(page.getByRole('status')).toHaveText('Saved.');
  expect(ifMatch).toEqual(['"1"', '"7"']);
});
