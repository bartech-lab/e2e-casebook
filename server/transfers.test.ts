import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createTransfers } from './transfers.ts';

test('transfers are kept per sandbox exactly as sent', async () => {
  const transfers = createTransfers();
  const f = Fastify();
  await f.register(async (scope) => transfers.register(scope), { prefix: '/api/s/:sandbox' });
  assert.equal((await f.inject({ method: 'POST', url: '/api/s/a/transfers', payload: {} })).statusCode, 400);
  await f.inject({ method: 'POST', url: '/api/s/a/transfers', payload: { account: 'PL61 1090' } });
  assert.deepEqual((await f.inject({ url: '/api/s/a/transfers' })).json(), { transfers: [{ account: 'PL61 1090' }] });
  assert.deepEqual((await f.inject({ url: '/api/s/b/transfers' })).json(), { transfers: [] });
});
