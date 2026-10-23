import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('files: delete removes one file, unknown is 404, reset restores', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const list = async () => (await app.inject({ method: 'GET', url: `/api/s/${sb}/files` })).json().files;
  assert.equal((await app.inject({ method: 'DELETE', url: `/api/s/${sb}/files/notes.txt` })).statusCode, 204);
  assert.deepEqual(await list(), ['budget.xlsx', 'contract.pdf', 'holiday.jpg', 'report.pdf']);
  assert.equal((await app.inject({ method: 'DELETE', url: `/api/s/${sb}/files/notes.txt` })).statusCode, 404);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.equal((await list()).length, 5);
});
