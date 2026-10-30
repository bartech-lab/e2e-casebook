import { expect, join, test } from '../fixtures.ts';

test('a failed export can be retried as a new export', async ({ page, sandbox }) => {
  await sandbox.fault({ exports: { stepMs: 30, failAtStep: 3 } });
  await join(page, sandbox, 'alice', 'exports');
  await page.getByRole('button', { name: 'Export board as CSV' }).click();
  const first = page.getByRole('listitem', { name: 'Export #1' });
  await expect(first.getByTestId('export-status')).toHaveText('Failed');
  await expect(first.getByRole('progressbar')).toHaveAttribute('value', '20');

  await first.getByRole('button', { name: 'Retry' }).click();
  const retry = page.getByRole('listitem', { name: 'Export #2' });
  await expect(retry).toContainText('retry of #1');
  await expect(retry.getByTestId('export-status')).toHaveText('Done');
  await expect(first.getByTestId('export-status')).toHaveText('Failed');
});

test('a cancelled export stops where it was', async ({ page, sandbox }) => {
  await sandbox.fault({ exports: { stepMs: 300 } });
  await join(page, sandbox, 'alice', 'exports');
  await page.getByRole('button', { name: 'Export board as CSV' }).click();
  const job = page.getByRole('listitem', { name: 'Export #1' });
  await expect(job.getByRole('progressbar')).not.toHaveAttribute('value', '0');
  await job.getByRole('button', { name: 'Cancel' }).click();
  await expect(job.getByTestId('export-status')).toHaveText('Cancelled');

  const atCancel = (await sandbox.exportJob(1)).progress;
  // Proving that something does not happen needs a wait: three step lengths.
  await page.waitForTimeout(900);
  expect((await sandbox.exportJob(1)).progress, 'progress after cancel').toBe(atCancel);
  await expect(job.getByRole('link', { name: 'Download CSV' })).toHaveCount(0);
});
