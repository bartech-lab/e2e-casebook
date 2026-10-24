import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createBusTimes } from './busTimes.ts';

async function app() {
  const bus = createBusTimes();
  const f = Fastify();
  await f.register(async (scope) => bus.register(scope), { prefix: '/api/s/:sandbox' });
  return { f, bus };
}

test('departures per sandbox, never cached by HTTP', async () => {
  const { f, bus } = await app();
  const res = await f.inject('/api/s/a/bus');
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.equal(res.json().departures.length, 3);
  bus.setDepartures('a', [{ line: '1', to: 'X', time: '08:00' }]);
  assert.deepEqual((await f.inject('/api/s/a/bus')).json(), { departures: [{ line: '1', to: 'X', time: '08:00' }] });
  assert.equal((await f.inject('/api/s/b/bus')).json().departures.length, 3);
});

test('failNext makes exactly that many requests fail', async () => {
  const { f, bus } = await app();
  bus.failNext('a', 2);
  assert.equal((await f.inject('/api/s/a/bus')).statusCode, 500);
  assert.equal((await f.inject('/api/s/a/bus')).statusCode, 500);
  assert.equal((await f.inject('/api/s/a/bus')).statusCode, 200);
  bus.failNext('a', 1);
  bus.clear('a');
  assert.equal((await f.inject('/api/s/a/bus')).statusCode, 200);
});
