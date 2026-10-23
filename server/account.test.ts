import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('account: session or 30-day cookie, wrong password sets nothing, logout ends the session', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const login = (payload: object) => app.inject({ method: 'POST', url: `/api/s/${sb}/account/login`, payload });
  const wrong = await login({ email: 'ann@example.test', password: 'nope' });
  assert.equal(wrong.statusCode, 401);
  assert.equal(wrong.headers['set-cookie'], undefined);
  const session = String((await login({ email: 'ann@example.test', password: 'correct horse' })).headers['set-cookie']);
  assert.doesNotMatch(session, /Max-Age/);
  const kept = String((await login({ email: 'ann@example.test', password: 'correct horse', remember: true })).headers['set-cookie']);
  assert.match(kept, /; HttpOnly; SameSite=Lax; Max-Age=2592000$/);
  const cookie = kept.split(';')[0]!;
  const me = () => app.inject({ method: 'GET', url: `/api/s/${sb}/account/me`, headers: { cookie } });
  assert.deepEqual((await me()).json(), { email: 'ann@example.test' });
  await app.inject({ method: 'POST', url: `/api/s/${sb}/account/logout`, headers: { cookie } });
  assert.equal((await me()).statusCode, 401);
});
