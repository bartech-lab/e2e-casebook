import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { buildApp } from './app.ts';
import { createSales } from './sales.ts';

test('flash sale: reports the server time, ends when the hook says, and refuses purchases after the end', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const sale = (await app.inject({ method: 'GET', url: `/api/s/${sb}/sale` })).json();
  assert.equal(sale.price, 19900);
  const left = Date.parse(sale.endsAt) - Date.parse(sale.now);
  assert.ok(left > 14 * 60_000 && left <= 15 * 60_000);
  assert.equal((await app.inject({ method: 'POST', url: `/api/s/${sb}/sale/buy` })).statusCode, 200);
  assert.equal((await app.inject({ method: 'POST', url: `/__test__/s/${sb}/sale`, payload: { endsInMs: 'soon' } })).statusCode, 400);
  assert.equal((await app.inject({ method: 'POST', url: `/__test__/s/${sb}/sale`, payload: { endsInMs: -1 } })).statusCode, 200);
  const buy = await app.inject({ method: 'POST', url: `/api/s/${sb}/sale/buy` });
  assert.equal(buy.statusCode, 410);
  assert.equal(buy.json().error, 'The sale has ended.');
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.equal((await app.inject({ method: 'POST', url: `/api/s/${sb}/sale/buy` })).statusCode, 200);
});

test('the sale ends exactly at its end time, and a buy before it answers with the price', async () => {
  let clock = 1_000_000;
  const sales = createSales(() => clock);
  const f = Fastify();
  await f.register(async (scope) => sales.register(scope), { prefix: '/api/s/:sandbox' });
  const buy = () => f.inject({ method: 'POST', url: '/api/s/a/sale/buy' });
  sales.endIn('a', 1000);
  clock += 999;
  assert.deepEqual((await buy()).json(), { price: 19900 });
  clock += 1;
  assert.equal((await buy()).statusCode, 410);
});
