import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildApp } from './app.ts';

test('uploads: stores name, size and sha256, refuses more than 20 MB', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const body = Buffer.alloc(1000, 7);
  const put = await app.inject({ method: 'PUT', url: `/api/s/${sb}/uploads/${encodeURIComponent('Clip #2.mp4')}`, headers: { 'content-type': 'application/octet-stream' }, payload: body });
  assert.equal(put.statusCode, 201);
  assert.deepEqual(put.json(), { name: 'Clip #2.mp4', size: 1000, sha256: createHash('sha256').update(body).digest('hex') });
  const big = await app.inject({ method: 'PUT', url: `/api/s/${sb}/uploads/big`, headers: { 'content-type': 'application/octet-stream' }, payload: Buffer.alloc(20 * 1024 * 1024 + 1) });
  assert.equal(big.statusCode, 413);
  assert.equal((await app.inject({ method: 'GET', url: `/api/s/${sb}/uploads` })).json().length, 1);
});
