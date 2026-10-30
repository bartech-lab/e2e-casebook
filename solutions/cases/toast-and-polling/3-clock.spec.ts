import { expect, join, test } from '../fixtures.ts';
import { saveDisplayName, toast } from './helpers.ts';

test('the toast stays for 2 seconds of page time, then goes', async ({ page, sandbox }) => {
  await page.clock.install();
  await join(page, sandbox, 'alice', 'settings');
  await saveDisplayName(page, 'Alice');
  await expect(toast(page)).toBeVisible();
  await page.clock.pauseAt(Date.now() + 1);
  await page.clock.runFor(1_900);
  await expect(toast(page)).toBeVisible();
  await page.clock.runFor(200);
  await expect(toast(page)).toHaveCount(0);
});
