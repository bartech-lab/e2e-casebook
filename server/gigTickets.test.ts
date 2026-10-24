import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createGigTickets } from './gigTickets.ts';

async function app() {
  const gig = createGigTickets();
  const f = Fastify();
  await f.register(async (scope) => gig.register(scope), { prefix: '/api/s/:sandbox' });
  return { f, gig };
}

test('buying lowers the stock and numbers orders per sandbox', async () => {
  const { f } = await app();
  const buy = (sandbox: string, quantity: unknown) => f.inject({ method: 'POST', url: `/api/s/${sandbox}/gig/buy`, payload: { quantity } });
  assert.deepEqual((await buy('a', 2)).json(), { order: { id: 'G-1', quantity: 2 }, left: 4 });
  assert.deepEqual((await buy('a', 4)).json(), { order: { id: 'G-2', quantity: 4 }, left: 0 });
  assert.equal((await buy('a', 1)).statusCode, 409);
  assert.deepEqual((await buy('b', 1)).json(), { order: { id: 'G-1', quantity: 1 }, left: 5 });
  assert.deepEqual((await f.inject(`/api/s/a/gig`)).json(), { left: 0, orders: [{ id: 'G-1', quantity: 2 }, { id: 'G-2', quantity: 4 }] });
});

test('quantity must be a whole number from 1 to 4', async () => {
  const { f } = await app();
  for (const q of [0, 5, 1.5, '2', null]) {
    const res = await f.inject({ method: 'POST', url: '/api/s/a/gig/buy', payload: { quantity: q } });
    assert.equal(res.statusCode, 400, String(q));
  }
});

test('setLeft and clear', async () => {
  const { f, gig } = await app();
  gig.setLeft('a', 1);
  assert.equal((await f.inject('/api/s/a/gig')).json().left, 1);
  gig.clear('a');
  assert.equal((await f.inject('/api/s/a/gig')).json().left, 6);
});
