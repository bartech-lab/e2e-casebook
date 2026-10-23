import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('invite: stable until replaced, a new link differs, reset clears', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const get = async () => (await app.inject({ method: 'GET', url: `/api/s/${sb}/invite` })).json().path as string;
  const first = await get();
  assert.match(first, /^\/invite\/[\w-]{12}$/);
  assert.equal(await get(), first);
  const next = (await app.inject({ method: 'POST', url: `/api/s/${sb}/invite` })).json().path as string;
  assert.notEqual(next, first);
  assert.equal(await get(), next);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.notEqual(await get(), next);
});
