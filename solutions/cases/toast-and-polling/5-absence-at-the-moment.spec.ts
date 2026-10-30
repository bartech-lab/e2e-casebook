import { expect, join, test } from '../fixtures.ts';
import { saveDisplayName, toast } from './helpers.ts';

test('no toast while the save is in flight, then the toast', async ({ page, sandbox }) => {
  await sandbox.fault({ http: [{ method: 'PUT', path: 'settings', delayMs: 1_000 }] });
  await join(page, sandbox, 'alice', 'settings');
  await saveDisplayName(page, 'Alice');
  await expect(page.getByRole('button', { name: 'Save settings' })).toBeDisabled();
  expect(await toast(page).count()).toBe(0);
  await expect(toast(page)).toBeVisible();
});

test('no toast at the moment a failed save shows its error', async ({ page, sandbox }) => {
  await sandbox.fault({ http: [{ method: 'PUT', path: 'settings', status: 500 }] });
  await join(page, sandbox, 'alice', 'settings');
  await saveDisplayName(page, 'Alice');
  await expect(page.getByRole('alert')).toContainText('Could not save settings');
  expect(await toast(page).count()).toBe(0);
});
