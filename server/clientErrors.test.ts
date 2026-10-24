import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createClientErrors } from './clientErrors.ts';

test('errors are logged per sandbox, capped at 200, and need a message', async () => {
  const log = createClientErrors();
  const f = Fastify();
  await f.register(async (scope) => log.register(scope), { prefix: '/api/s/:sandbox' });
  assert.equal((await f.inject({ method: 'POST', url: '/api/s/a/client-errors', payload: { message: 'Boom' } })).statusCode, 204);
  assert.equal((await f.inject({ method: 'POST', url: '/api/s/a/client-errors', payload: {} })).statusCode, 400);
  for (let i = 0; i < 250; i++) await f.inject({ method: 'POST', url: '/api/s/a/client-errors', payload: { message: `e${i}` } });
  assert.equal((await f.inject({ url: '/api/s/a/client-errors' })).json().errors.length, 200);
  assert.equal((await f.inject({ url: '/api/s/a/client-errors' })).json().errors[0], 'Boom');
  assert.deepEqual((await f.inject({ url: '/api/s/b/client-errors' })).json().errors, []);
});
