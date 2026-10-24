import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createCloudPix } from './cloudPix.ts';

test('a code works once, only in its own sandbox, and every exchange is counted', async () => {
  const pix = createCloudPix();
  const f = Fastify();
  await f.register(async (scope) => pix.register(scope), { prefix: '/api/s/:sandbox' });
  const { code } = (await f.inject({ method: 'POST', url: '/api/s/a/cloudpix/codes' })).json();
  const token = (s: string, c: unknown) => f.inject({ method: 'POST', url: `/api/s/${s}/cloudpix/token`, payload: { code: c } });
  assert.equal((await token('b', code)).statusCode, 400);
  const ok = await token('a', code);
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.json().account, 'alice@cloudpix.test');
  assert.equal((await token('a', code)).statusCode, 400);
  assert.equal(pix.exchanges('a'), 1);
  assert.equal(pix.exchanges('b'), 0);
});
