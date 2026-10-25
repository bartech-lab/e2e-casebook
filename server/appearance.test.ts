import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('appearance: defaults to the system, saves valid choices, and rejects others', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const url = `/api/s/${sb}/appearance`;
  assert.deepEqual((await app.inject({ method: 'GET', url })).json(), { theme: 'system', motion: 'system' });
  assert.equal((await app.inject({ method: 'PUT', url, payload: { theme: 'sepia', motion: 'full' } })).statusCode, 400);
  assert.equal((await app.inject({ method: 'PUT', url, payload: { theme: 'dark' } })).statusCode, 400);
  assert.deepEqual((await app.inject({ method: 'PUT', url, payload: { theme: 'dark', motion: 'reduce' } })).json(), { theme: 'dark', motion: 'reduce' });
  assert.deepEqual((await app.inject({ method: 'GET', url })).json(), { theme: 'dark', motion: 'reduce' });
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.deepEqual((await app.inject({ method: 'GET', url })).json(), { theme: 'system', motion: 'system' });
});

test('appearance: an unknown motion setting is refused', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const res = await app.inject({ method: 'PUT', url: `/api/s/${sb}/appearance`, payload: { theme: 'dark', motion: 'fast' } });
  assert.equal(res.statusCode, 400);
});
