import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createFlights } from './flights.ts';

test('flights are filtered by route, paced per sandbox, and counted', async () => {
  const flights = createFlights();
  const f = Fastify();
  await f.register(async (scope) => flights.register(scope), { prefix: '/api/s/:sandbox' });
  assert.equal(flights.setPace('a', -1), false);
  assert.equal(flights.setPace('a', 50), true);
  const started = Date.now();
  const res = await f.inject({ url: '/api/s/a/flights?from=KRK&to=CDG' });
  assert.ok(Date.now() - started >= 45);
  assert.deepEqual(res.json().flights.map((x: { code: string }) => x.code), ['LO 335', 'AF 1747']);
  assert.deepEqual(flights.stats('a'), { started: 1, completed: 1, aborted: 0 });
  assert.deepEqual(flights.stats('b'), { started: 0, completed: 0, aborted: 0 });
});
