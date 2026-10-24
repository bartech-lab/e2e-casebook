import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createHandover } from './handover.ts';

test('a handover note keeps its text and a sorted set of known people', async () => {
  const h = createHandover();
  const f = Fastify();
  await f.register(async (scope) => h.register(scope), { prefix: '/api/s/:sandbox' });
  const post = (payload: object) => f.inject({ method: 'POST', url: '/api/s/a/handover', payload });
  assert.equal((await post({ text: ' ', mentions: [] })).statusCode, 400);
  assert.equal((await post({ text: 'Hi', mentions: [9] })).statusCode, 400);
  assert.equal((await post({ text: 'Hi @Ola Nowak', mentions: [4, 1, 4] })).statusCode, 200);
  assert.deepEqual((await f.inject({ url: '/api/s/a/handover' })).json(), { notes: [{ text: 'Hi @Ola Nowak', mentions: [1, 4] }] });
  assert.deepEqual((await f.inject({ url: '/api/s/b/handover' })).json(), { notes: [] });
});
