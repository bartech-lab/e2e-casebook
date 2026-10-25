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

test('a transfer needs a non-empty account, transfers accumulate, and clear forgets them', async () => {
  const transfers = createTransfers();
  const f = Fastify();
  await f.register(async (scope) => transfers.register(scope), { prefix: '/api/s/:sandbox' });
  const send = (account: string) => f.inject({ method: 'POST', url: '/api/s/a/transfers', payload: { account } });
  assert.equal((await send('')).statusCode, 400);
  await send('PL61109010140000071219812874');
  await send('PL27114020040000300201355387');
  assert.equal((await f.inject({ url: '/api/s/a/transfers' })).json().transfers.length, 2);
  transfers.clear('a');
  assert.deepEqual((await f.inject({ url: '/api/s/a/transfers' })).json(), { transfers: [] });
});
