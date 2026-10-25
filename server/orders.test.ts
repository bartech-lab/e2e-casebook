import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('orders: numeric and text sorts with a stable tie-break, pages, seed hook, validation', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const get = async (q: string) => (await app.inject({ method: 'GET', url: `/api/s/${sb}/order-list?${q}` })).json();
  assert.deepEqual([(await get('')).pages, (await get('')).count, (await get('page=3')).orders.length], [3, 23, 3]);
  const seed = [
    { number: 1, customer: 'Bo', total: 2000, date: '2026-01-02' },
    { number: 2, customer: 'Al', total: 500, date: '2026-01-01' },
    { number: 3, customer: 'Bo', total: 10000, date: '2026-01-03' },
  ];
  assert.equal((await app.inject({ method: 'POST', url: `/__test__/s/${sb}/order-list`, payload: { orders: seed } })).statusCode, 200);
  const numbers = async (q: string) => (await get(q)).orders.map((o: { number: number }) => o.number);
  assert.deepEqual(await numbers('sort=total'), [2, 1, 3]);
  assert.deepEqual(await numbers('sort=customer&dir=desc'), [1, 3, 2]);
  assert.deepEqual(await numbers('sort=date&dir=desc'), [3, 1, 2]);
  for (const q of ['sort=price', 'dir=up', 'page=0', 'page=x']) assert.equal((await app.inject({ method: 'GET', url: `/api/s/${sb}/order-list?${q}` })).statusCode, 400, q);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.equal((await get('')).count, 23);
});

test('orders: ties fall back to ascending order number in both directions, text sorts by locale, an empty list has one page', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const seed = (orders: unknown[]) => app.inject({ method: 'POST', url: `/__test__/s/${sb}/order-list`, payload: { orders } });
  const get = async (q: string) => (await app.inject({ method: 'GET', url: `/api/s/${sb}/order-list?${q}` })).json();
  const numbers = async (q: string) => (await get(q)).orders.map((o: { number: number }) => o.number);
  await seed([
    { number: 3, customer: 'Bo', total: 100, date: '2026-01-01' },
    { number: 1, customer: 'Bo', total: 100, date: '2026-01-01' },
    { number: 2, customer: 'al', total: 100, date: '2026-01-01' },
  ]);
  assert.deepEqual(await numbers('sort=customer'), [2, 1, 3]);
  assert.deepEqual(await numbers('sort=customer&dir=desc'), [1, 3, 2]);
  await seed([]);
  assert.deepEqual(await get(''), { orders: [], page: 1, pages: 1, count: 0 });
});
