import { expect, join, test } from '../fixtures.ts';
import { saveDisplayName, savedDisplayName, toast } from './helpers.ts';

test('the toast appears after a save, and the value is stored', async ({ page, request, sandbox }) => {
  await join(page, sandbox, 'alice', 'settings');
  await saveDisplayName(page, 'Alice');
  await expect(toast(page)).toBeVisible();
  expect(await savedDisplayName(request, sandbox.id)).toBe('Alice');
});

test('a failed save shows an error and no toast', async ({ page, sandbox }) => {
  await sandbox.fault({ http: [{ method: 'PUT', path: 'settings', status: 500 }] });
  await join(page, sandbox, 'alice', 'settings');
  await saveDisplayName(page, 'Alice');
  await expect(page.getByRole('alert')).toContainText('Could not save settings');
  await expect(toast(page)).toHaveCount(0);
});
