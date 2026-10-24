import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('price alerts: off by default, saved per sandbox, and the price moves only through the test hook', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const url = `/api/s/${sb}/price-alert`;
  assert.deepEqual((await app.inject({ method: 'GET', url })).json(), { price: 34900, on: false });
  assert.equal((await app.inject({ method: 'PUT', url, payload: { on: 'yes' } })).statusCode, 400);
  assert.deepEqual((await app.inject({ method: 'PUT', url, payload: { on: true } })).json(), { price: 34900, on: true });
  assert.equal((await app.inject({ method: 'POST', url: `/__test__/s/${sb}/price`, payload: { price: -1 } })).statusCode, 400);
  assert.deepEqual((await app.inject({ method: 'POST', url: `/__test__/s/${sb}/price`, payload: { price: 29900 } })).json(), { price: 29900, on: true });
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.deepEqual((await app.inject({ method: 'GET', url })).json(), { price: 34900, on: false });
});
