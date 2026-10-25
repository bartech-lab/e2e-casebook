import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('bookings: numbered per sandbox, priced in grosze, validated, cleared by reset', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const book = (payload: object) => app.inject({ method: 'POST', url: `/api/s/${sb}/bookings`, payload });
  const ok = { checkIn: '2026-11-20', nights: 3, adults: 2, children: 1 };
  const first = await book(ok);
  assert.equal(first.statusCode, 201, first.body);
  assert.deepEqual(first.json(), { id: 'BK-1', ...ok, total: 112500 });
  assert.equal((await book({ ...ok, children: 0 })).json().id, 'BK-2');
  for (const bad of [{ ...ok, checkIn: '20.11.2026' }, { ...ok, nights: 0 }, { ...ok, nights: 15 }, { ...ok, adults: 5 }, { ...ok, children: -1 }, { ...ok, nights: 2.5 }]) {
    assert.equal((await book(bad)).statusCode, 400, JSON.stringify(bad));
  }
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.deepEqual((await app.inject({ method: 'GET', url: `/api/s/${sb}/bookings` })).json(), { bookings: [] });
});

async function sandboxApp(t: { after: (fn: () => Promise<void>) => void }) {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  return { app, sb };
}

test('bookings: the top of each range is allowed, one more is not, and the date must be exactly YYYY-MM-DD', async (t) => {
  const { app, sb } = await sandboxApp(t);
  const book = (body: Record<string, unknown>) =>
    app.inject({ method: 'POST', url: `/api/s/${sb}/bookings`, payload: { checkIn: '2026-11-02', nights: 1, adults: 1, children: 0, ...body } });
  assert.equal((await book({ nights: 14, adults: 4, children: 3 })).statusCode, 201);
  for (const bad of [{ children: 4 }, { checkIn: '2026-11-022' }, { checkIn: 'x2026-11-02' }]) assert.equal((await book(bad)).statusCode, 400, JSON.stringify(bad));
});
