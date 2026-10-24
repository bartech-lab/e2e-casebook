import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('notes schema: version 1 by default, set per sandbox by the test hook, reset clears it', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const get = async () => (await app.inject({ method: 'GET', url: `/api/s/${sb}/notes-schema` })).json();
  assert.deepEqual(await get(), { version: 1 });
  assert.equal((await app.inject({ method: 'POST', url: `/__test__/s/${sb}/notes-schema`, payload: { version: 3 } })).statusCode, 400);
  assert.equal((await app.inject({ method: 'POST', url: `/__test__/s/${sb}/notes-schema`, payload: { version: 2 } })).statusCode, 200);
  assert.deepEqual(await get(), { version: 2 });
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.deepEqual(await get(), { version: 1 });
});
