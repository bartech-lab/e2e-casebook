import { expect, join, test } from '../fixtures.ts';
import { saveDisplayName, toast } from './helpers.ts';

test('wait for network idle before checking the toast @naive', async ({ page, sandbox }) => {
  await join(page, sandbox, 'alice', 'settings');
  await page.waitForLoadState('networkidle', { timeout: 5_000 });
  await saveDisplayName(page, 'Alice');
  await page.waitForLoadState('networkidle', { timeout: 5_000 });
  await expect(toast(page)).toBeVisible();
});
