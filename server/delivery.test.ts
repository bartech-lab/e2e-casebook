import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('delivery: a drawn PNG or a typed name of 2+ characters is stored', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const sign = (payload: object) => app.inject({ method: 'POST', url: `/api/s/${sb}/delivery/sign`, payload });
  const get = () => app.inject({ method: 'GET', url: `/api/s/${sb}/delivery/signature` });
  assert.equal((await get()).statusCode, 404);
  assert.equal((await sign({ kind: 'typed', name: ' a ' })).statusCode, 400);
  assert.equal((await sign({ kind: 'drawn', png: 'data:image/jpeg;base64,xx' })).statusCode, 400);
  assert.equal((await sign({ kind: 'typed', name: ' Ann Lee ' })).statusCode, 200);
  assert.deepEqual((await get()).json(), { kind: 'typed', name: 'Ann Lee' });
});

test('delivery: a drawn signature must be under 500000 characters, and reset forgets the signature', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const prefix = 'data:image/png;base64,';
  const sign = (length: number) => app.inject({ method: 'POST', url: `/api/s/${sb}/delivery/sign`, payload: { kind: 'drawn', png: prefix + 'A'.repeat(length - prefix.length) } });
  assert.equal((await sign(500_000)).statusCode, 400);
  assert.equal((await sign(499_999)).statusCode, 200);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.equal((await app.inject({ method: 'GET', url: `/api/s/${sb}/delivery/signature` })).statusCode, 404);
});
