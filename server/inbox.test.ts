import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('inbox: archive removes exactly the given ids, validated, reset restores', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const ids = async () => (await app.inject({ method: 'GET', url: `/api/s/${sb}/inbox` })).json().messages.map((m: { id: number }) => m.id);
  assert.deepEqual(await ids(), [1, 2, 3, 4, 5, 6, 7, 8]);
  const archive = (payload: object) => app.inject({ method: 'POST', url: `/api/s/${sb}/inbox/archive`, payload });
  assert.equal((await archive({ ids: [2, 5, 7] })).statusCode, 200);
  assert.deepEqual(await ids(), [1, 3, 4, 6, 8]);
  for (const bad of [{}, { ids: [] }, { ids: ['1'] }]) assert.equal((await archive(bad)).statusCode, 400);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.deepEqual(await ids(), [1, 2, 3, 4, 5, 6, 7, 8]);
});
