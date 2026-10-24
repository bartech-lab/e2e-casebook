import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createReaderAuth } from './readerAuth.ts';

async function app() {
  const auth = createReaderAuth();
  const f = Fastify();
  await f.register(async (scope) => auth.register(scope), { prefix: '/api/s/:sandbox' });
  return { f, auth };
}
const login = (f: Awaited<ReturnType<typeof app>>['f'], sandbox: string, password = 'pierogi-2026') =>
  f.inject({ method: 'POST', url: `/api/s/${sandbox}/reader/login`, payload: { email: 'ola@example.com', password } });
const me = (f: Awaited<ReturnType<typeof app>>['f'], sandbox: string, token: string) =>
  f.inject({ url: `/api/s/${sandbox}/reader/me`, headers: { authorization: `Bearer ${token}` } });

test('a token works until logout, only in its sandbox', async () => {
  const { f } = await app();
  assert.equal((await login(f, 'a', 'nope')).statusCode, 401);
  const { token } = (await login(f, 'a')).json();
  assert.deepEqual((await me(f, 'a', token)).json(), { email: 'ola@example.com' });
  assert.equal((await me(f, 'b', token)).statusCode, 401);
  await f.inject({ method: 'POST', url: '/api/s/a/reader/logout', headers: { authorization: `Bearer ${token}` } });
  assert.equal((await me(f, 'a', token)).statusCode, 401);
});

test('expireAll ends every session of the sandbox', async () => {
  const { f, auth } = await app();
  const t1 = (await login(f, 'a')).json().token;
  const t2 = (await login(f, 'a')).json().token;
  const other = (await login(f, 'b')).json().token;
  assert.deepEqual(auth.expireAll('a'), { expired: 2 });
  assert.equal((await me(f, 'a', t1)).statusCode, 401);
  assert.equal((await me(f, 'a', t2)).statusCode, 401);
  assert.equal((await me(f, 'b', other)).statusCode, 200);
});
