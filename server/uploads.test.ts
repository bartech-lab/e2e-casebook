import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
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

async function setup(t: { after: (fn: () => Promise<void>) => void }) {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const put = (name: string, payload: Buffer | Readable, headers: Record<string, string> = {}) =>
    app.inject({ method: 'PUT', url: `/api/s/${sb}/uploads/${name}`, headers: { 'content-type': 'application/octet-stream', ...headers }, payload });
  const hook = (op: string, payload: object) => app.inject({ method: 'POST', url: `/__test__/s/${sb}/${op}`, payload });
  const list = async () => (await app.inject({ method: 'GET', url: `/api/s/${sb}/uploads` })).json();
  return { put, hook, list };
}

test('uploads: exactly 20 MB is accepted, and a re-upload replaces the file of the same name', async (t) => {
  const { put, list } = await setup(t);
  assert.equal((await put('clip', Buffer.alloc(10))).statusCode, 201);
  assert.equal((await put('clip', Buffer.alloc(20 * 1024 * 1024))).statusCode, 201);
  assert.deepEqual((await list()).map((u: { name: string; size: number }) => [u.name, u.size]), [['clip', 20 * 1024 * 1024]]);
});

test('uploads: a streamed body over 20 MB without a length is refused, and a declared length over 20 MB is refused before reading', async (t) => {
  const { put, list } = await setup(t);
  const chunk = Buffer.alloc(1024 * 1024);
  const streamed = Readable.from((function* () {
    for (let i = 0; i < 21; i++) yield chunk;
  })());
  assert.equal((await put('streamed', streamed, { 'transfer-encoding': 'chunked' })).statusCode, 413);
  const declared = Readable.from((function* () {
    yield Buffer.alloc(10);
  })());
  assert.equal((await put('declared', declared, { 'content-length': String(20 * 1024 * 1024 + 1) })).statusCode, 413);
  assert.deepEqual(await list(), []);
});

test('uploads: the pace hook slows the upload until it is set back to 0, and reset clears files and pace', async (t) => {
  const { put, hook, list } = await setup(t);
  await hook('upload-pace', { bytesPerSecond: 2000 });
  let start = Date.now();
  await put('slow', Buffer.alloc(1000));
  assert.ok(Date.now() - start >= 400, 'paced upload finished too fast');
  await hook('upload-pace', { bytesPerSecond: 0 });
  start = Date.now();
  await put('fast', Buffer.alloc(1000));
  assert.ok(Date.now() - start < 300, 'pace 0 should stop pacing');
  await hook('upload-pace', { bytesPerSecond: 2000 });
  await hook('reset', {});
  start = Date.now();
  await put('after-reset', Buffer.alloc(1000));
  assert.ok(Date.now() - start < 300, 'reset should clear the pace');
  assert.deepEqual((await list()).map((u: { name: string }) => u.name), ['after-reset']);
});
