import { readFile } from 'node:fs/promises';
import { expect, join, test } from '../fixtures.ts';

test('an export with real timing finishes and downloads the board', async ({ page, sandbox }) => {
  await join(page, sandbox, 'alice', 'exports');
  await page.getByRole('button', { name: 'Export board as CSV' }).click();
  const job = page.getByRole('listitem', { name: 'Export #1' });
  await expect(job.getByTestId('export-status')).toHaveText('Done', { timeout: 15_000 });

  const download = page.waitForEvent('download');
  await job.getByRole('link', { name: 'Download CSV' }).click();
  const csv = await readFile(await (await download).path(), 'utf8');
  expect(csv.split('\n')[0]).toBe('id,title,status,version');
  expect(csv).toContain('"Write the release notes"');
});
