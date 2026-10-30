import { expect, test } from '../fixtures.ts';

test('the server rejects a stale If-Match and keeps the newer data', async ({ sandbox }) => {
  expect(await sandbox.patchCard(1, { title: 'First', by: 'alice' }, 1)).toBe(200);
  expect(await sandbox.patchCard(1, { title: 'Stale', by: 'bob' }, 1)).toBe(412);
  expect(await sandbox.card(1)).toMatchObject({ title: 'First', version: 2 });
  expect(await sandbox.patchCard(1, { title: 'Current', by: 'bob' }, 2)).toBe(200);
  expect(await sandbox.card(1)).toMatchObject({ title: 'Current', version: 3 });
});
