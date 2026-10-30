import { column, expect, join, moveCard, test } from '../fixtures.ts';

test('a move the network rejects goes back, with one error', async ({ page, sandbox }) => {
  await page.route(/\/cards\/1$/, (route) =>
    route.request().method() === 'PATCH' ? route.fulfill({ status: 500, json: { error: 'mocked' } }) : route.continue(),
  );
  await join(page, sandbox, 'alice', 'board');
  await moveCard(page, 'Write the release notes', 'Doing');
  await expect(page.getByRole('alert')).toHaveText(/Could not move “Write the release notes” to Doing/);
  await expect(column(page, 'To do')).toContainText(['Write the release notes']);
  await expect(column(page, 'Doing')).not.toContainText(['Write the release notes']);
  await expect(page.getByRole('alert')).toHaveCount(1);
});
