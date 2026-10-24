import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { ACTS, createRunningOrder } from './runningOrder.ts';

test('the running order accepts only a reordering of every act, per sandbox', async () => {
  const r = createRunningOrder();
  const f = Fastify();
  await f.register(async (scope) => r.register(scope), { prefix: '/api/s/:sandbox' });
  const put = (acts: unknown) => f.inject({ method: 'PUT', url: '/api/s/a/running-order', payload: { acts } });
  assert.equal((await put(ACTS.slice(1))).statusCode, 400);
  assert.equal((await put([...ACTS.slice(0, 29), ACTS[1]])).statusCode, 400);
  const moved = [...ACTS.slice(1), ACTS[0]];
  assert.equal((await put(moved)).statusCode, 200);
  assert.deepEqual((await f.inject({ url: '/api/s/a/running-order' })).json().acts, moved);
  assert.deepEqual((await f.inject({ url: '/api/s/b/running-order' })).json().acts, ACTS);
});
