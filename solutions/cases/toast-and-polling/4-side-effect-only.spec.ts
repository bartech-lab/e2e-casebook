import { expect, join, test } from '../fixtures.ts';
import { saveDisplayName, savedDisplayName } from './helpers.ts';

test('the save reaches the server (the toast is not checked)', async ({ page, request, sandbox }) => {
  await join(page, sandbox, 'alice', 'settings');
  await saveDisplayName(page, 'Alice');
  await expect.poll(() => savedDisplayName(request, sandbox.id)).toBe('Alice');
});
