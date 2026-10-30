import { expect, join, test } from '../fixtures.ts';

const job = (status: string, progress: number) => ({ id: 1, status, progress, error: status === 'failed' ? 'boom' : null, retryOf: null });

test('the page keeps polling while running and offers only the actions that fit', async ({ page, sandbox }) => {
  const script = [job('running', 30), job('running', 60), job('failed', 60)];
  let gets = 0;
  await page.route(/\/api\/s\/[a-z0-9]+\/exports$/, (route) => {
    if (route.request().method() === 'POST') return route.fulfill({ status: 201, json: job('running', 0) });
    const current = script[Math.min(gets, script.length - 1)]!;
    gets += 1;
    return route.fulfill({ json: { exports: [current] } });
  });

  await join(page, sandbox, 'alice', 'exports');
  const item = page.getByRole('listitem', { name: 'Export #1' });
  await expect(item.getByRole('progressbar')).toHaveAttribute('value', '30');
  await expect(item.getByRole('button', { name: 'Cancel' })).toBeVisible();
  await expect(item.getByRole('link', { name: 'Download CSV' })).toHaveCount(0);

  await expect(item.getByTestId('export-status')).toHaveText('Failed', { timeout: 5_000 });
  await expect(item.getByRole('button', { name: 'Retry' })).toBeVisible();
  await expect(item.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
  const settled = gets;
  await page.waitForTimeout(1_500);
  expect(gets, 'polling must stop once nothing is running').toBe(settled);
});
