import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createExpenseClaims } from './expenseClaims.ts';

async function app() {
  const claims = createExpenseClaims();
  const f = Fastify();
  await f.register(async (scope) => claims.register(scope), { prefix: '/api/s/:sandbox' });
  return { f, claims };
}
type F = Awaited<ReturnType<typeof app>>['f'];
const login = async (f: F, sandbox: string, password = 'kawa-z-mlekiem') =>
  f.inject({ method: 'POST', url: `/api/s/${sandbox}/claims/login`, payload: { email: 'ewa@example.com', password } });
const auth = (token: string) => ({ authorization: `Bearer ${token}` });

test('a wrong password is a 401 and signs nobody in', async () => {
  const { f } = await app();
  const res = await login(f, 'a', 'herbata');
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.json(), { error: 'Wrong email or password.' });
});

test('claims need a live token and are kept per sandbox', async () => {
  const { f } = await app();
  const { token } = (await login(f, 'a')).json();
  assert.equal((await f.inject({ method: 'POST', url: '/api/s/a/claims', payload: { amount: 12.5, description: 'Taxi' } })).statusCode, 401);
  const made = await f.inject({ method: 'POST', url: '/api/s/a/claims', headers: auth(token), payload: { amount: 12.5, description: ' Taxi ' } });
  assert.equal(made.statusCode, 201);
  assert.deepEqual(made.json(), { id: 1, amount: 12.5, description: 'Taxi', status: 'submitted' });
  assert.equal((await f.inject({ method: 'POST', url: '/api/s/a/claims', headers: auth(token), payload: { amount: 0, description: 'x' } })).statusCode, 400);
  assert.equal((await f.inject({ url: '/api/s/a/claims', headers: auth(token) })).json().claims.length, 1);
  assert.equal((await f.inject({ url: '/api/s/b/claims', headers: auth(token) })).statusCode, 401);
});

test('approving is a 403 for a signed-in employee and a 401 without a session', async () => {
  const { f } = await app();
  const { token } = (await login(f, 'a')).json();
  const res = await f.inject({ method: 'POST', url: '/api/s/a/claims/1/approve', headers: auth(token) });
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.json(), { error: 'Only managers can approve claims.' });
  assert.equal((await f.inject({ method: 'POST', url: '/api/s/a/claims/1/approve' })).statusCode, 401);
});

test('expireAll and logout end sessions', async () => {
  const { f, claims } = await app();
  const t1 = (await login(f, 'a')).json().token;
  const t2 = (await login(f, 'a')).json().token;
  await f.inject({ method: 'POST', url: '/api/s/a/claims/logout', headers: auth(t1) });
  assert.equal((await f.inject({ url: '/api/s/a/claims', headers: auth(t1) })).statusCode, 401);
  assert.deepEqual(claims.expireAll('a'), { expired: 1 });
  assert.equal((await f.inject({ url: '/api/s/a/claims', headers: auth(t2) })).statusCode, 401);
});
