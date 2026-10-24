import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createBarber, HOLD_MS } from './barber.ts';

test('a hold is one person at a time, lasts five minutes by the shop clock, and booking needs a live hold', async () => {
  const barber = createBarber();
  const f = Fastify();
  await f.register(async (scope) => barber.register(scope), { prefix: '/api/s/:sandbox' });
  const post = (url: string, payload: object) => f.inject({ method: 'POST', url: `/api/s/a/barber/${url}`, payload });
  const state = async (name: string, slot: string) =>
    (await f.inject({ url: `/api/s/a/barber/slots?name=${name}` })).json().slots.find((s: { id: string }) => s.id === slot).state;

  assert.equal((await post('holds', { name: 'Ola', slot: 'sat-0900' })).statusCode, 200);
  assert.equal((await post('holds', { name: 'Marek', slot: 'sat-0900' })).statusCode, 409);
  assert.equal(await state('Marek', 'sat-0900'), 'held');
  assert.equal(await state('Ola', 'sat-0900'), 'mine');
  assert.equal((await post('holds', { name: 'Ola', slot: 'sat-0945' })).statusCode, 200);
  assert.equal(await state('Marek', 'sat-0900'), 'free');

  barber.advance('a', HOLD_MS);
  assert.equal(await state('Marek', 'sat-0945'), 'free');
  assert.equal((await post('bookings', { name: 'Ola', slot: 'sat-0945' })).statusCode, 409);
  assert.equal((await post('holds', { name: 'Marek', slot: 'sat-0945' })).statusCode, 200);
  assert.equal((await post('bookings', { name: 'Marek', slot: 'sat-0945' })).statusCode, 200);
  assert.deepEqual(barber.bookings('a'), { 'sat-0945': 'Marek' });
  assert.equal(await state('Ola', 'sat-0945'), 'booked');
});
