import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('version: starts at 1, the release hook bumps it, reset clears', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const version = async () => (await app.inject({ method: 'GET', url: `/api/s/${sb}/version` })).json().version;
  assert.equal(await version(), 1);
  assert.deepEqual((await app.inject({ method: 'POST', url: `/__test__/s/${sb}/release` })).json(), { version: 2 });
  assert.equal(await version(), 2);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.equal(await version(), 1);
});

test('version: each release adds one', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/release` });
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/release` });
  assert.deepEqual((await app.inject({ method: 'GET', url: `/api/s/${sb}/version` })).json(), { version: 3 });
});
