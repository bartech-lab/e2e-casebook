import { expect, test } from '../fixtures.ts';
import { join } from '../common.ts';
import { saveDisplayName, toast } from './helpers.ts';

test('wait for network idle before checking the toast @naive', async ({ page, sandbox }) => {
  await join(page, sandbox, 'alice', 'settings');
  await page.waitForLoadState('networkidle', { timeout: 5_000 });
  await saveDisplayName(page, 'Alice');
  await page.waitForLoadState('networkidle', { timeout: 5_000 });
  await expect(toast(page)).toBeVisible();
});
