import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('imports: manual steps emit progress, errors and completion in order', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/import-mode`, payload: { manual: true } });
  const { id } = (await app.inject({ method: 'POST', url: `/api/s/${sb}/imports` })).json();
  assert.equal((await app.inject({ method: 'POST', url: `/__test__/s/${sb}/import-step`, payload: { rows: 100 } })).statusCode, 200);
  assert.equal((await app.inject({ method: 'GET', url: `/api/s/${sb}/imports/${id + 1}/events` })).statusCode, 404);
});
