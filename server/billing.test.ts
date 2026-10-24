import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createBilling } from './billing.ts';

test('billing details are stored exactly as sent, per sandbox, and unknown fields are refused', async () => {
  const billing = createBilling();
  const f = Fastify();
  await f.register(async (scope) => billing.register(scope), { prefix: '/api/s/:sandbox' });
  const put = (payload: object) => f.inject({ method: 'PUT', url: '/api/s/a/billing', payload });
  assert.equal((await put({ buyer: 'person', name: 'Ola', age: '3' })).statusCode, 400);
  assert.equal((await put({ buyer: 'shop', name: 'Ola' })).statusCode, 400);
  assert.equal((await put({ buyer: 'person', name: 'Ola', email: 'ola@example.com' })).statusCode, 200);
  assert.deepEqual((await f.inject({ url: '/api/s/a/billing' })).json(), { billing: { buyer: 'person', name: 'Ola', email: 'ola@example.com' } });
  assert.deepEqual((await f.inject({ url: '/api/s/b/billing' })).json(), { billing: null });
});
