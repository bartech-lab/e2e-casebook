import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createEventFeedback } from './eventFeedback.ts';

async function app() {
  const fb = createEventFeedback();
  const f = Fastify();
  await f.register(async (scope) => fb.register(scope), { prefix: '/api/s/:sandbox' });
  return { f, fb };
}
const post = (f: Awaited<ReturnType<typeof app>>['f'], payload: object) => f.inject({ method: 'POST', url: '/api/s/a/event-feedback', payload });

test('stores trimmed entries with a rating from 1 to 5 sent as form text', async () => {
  const { f, fb } = await app();
  assert.deepEqual((await post(f, { name: ' Ola ', rating: '4', comment: ' great ' })).json(), { name: 'Ola', rating: 4, comment: 'great' });
  for (const rating of [undefined, '', '0', '6', '2.5', 3]) assert.equal((await post(f, { name: 'Ola', rating })).statusCode, 400, String(rating));
  assert.equal((await post(f, { name: ' ', rating: '3' })).statusCode, 400);
  assert.equal((await f.inject('/api/s/a/event-feedback')).json().entries.length, 1);
  fb.clear('a');
  assert.deepEqual((await f.inject('/api/s/a/event-feedback')).json(), { entries: [] });
});

test('a rating of 5 is the highest allowed', async () => {
  const fb = createEventFeedback();
  const f = Fastify();
  await f.register(async (scope) => fb.register(scope), { prefix: '/api/s/:sandbox' });
  const send = (rating: string) => f.inject({ method: 'POST', url: '/api/s/a/event-feedback', payload: { name: 'Ola', rating } });
  assert.equal((await send('5')).statusCode, 200);
  assert.equal((await send('6')).statusCode, 400);
});
