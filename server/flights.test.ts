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

test('an aborted flight search counts as aborted, not completed, and clear resets pace and counts', async (t) => {
  const flights = createFlights();
  const f = Fastify();
  await f.register(async (scope) => flights.register(scope), { prefix: '/api/s/:sandbox' });
  await f.listen({ port: 0, host: '127.0.0.1' });
  t.after(() => f.close());
  const { port } = f.server.address() as { port: number };
  assert.equal(flights.setPace('a', 120_001), false);
  assert.equal(flights.setPace('a', 300), true);
  const controller = new AbortController();
  const request = fetch(`http://127.0.0.1:${port}/api/s/a/flights?from=WAW&to=LHR`, { signal: controller.signal }).catch(() => null);
  for (let i = 0; i < 100 && flights.stats('a').started === 0; i++) await new Promise((r) => setTimeout(r, 5));
  controller.abort();
  await request;
  await new Promise((r) => setTimeout(r, 450));
  assert.deepEqual(flights.stats('a'), { started: 1, completed: 0, aborted: 1 });
  flights.clear('a');
  assert.deepEqual(flights.stats('a'), { started: 0, completed: 0, aborted: 0 });
  const start = Date.now();
  await f.inject({ url: '/api/s/a/flights?from=WAW&to=LHR' });
  assert.ok(Date.now() - start < 200, 'clear should drop the pace');
});
