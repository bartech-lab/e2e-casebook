import { column, expect, join, moveCard, test } from '../fixtures.ts';

test('a moved card stays in its new column after a reload', async ({ page, sandbox }) => {
  await join(page, sandbox, 'alice', 'board');
  await moveCard(page, 'Write the release notes', 'Doing');
  await expect(column(page, 'Doing')).toContainText(['Write the release notes']);
  await page.reload();
  await expect(column(page, 'Doing')).toContainText(['Write the release notes']);
});
