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

async function makeSandboxes(t: { after: (fn: () => Promise<void>) => void }, n = 1) {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const ids: string[] = [];
  for (let i = 0; i < n; i++) ids.push((await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string);
  return { app, ids };
}

test('account: only remember true persists the cookie, a cookie is read by exact name and sandbox, logout expires it, reset logs out one sandbox', async (t) => {
  const { app, ids: [a, b] } = await makeSandboxes(t, 2);
  const login = (sb: string, remember?: unknown) =>
    app.inject({ method: 'POST', url: `/api/s/${sb}/account/login`, payload: { email: 'ann@example.test', password: 'correct horse', remember } });
  const tokenOf = (res: { headers: Record<string, unknown> }, sb: string) => String(res.headers['set-cookie']).split(';')[0]!.slice(`account_${sb}=`.length);
  const me = (sb: string, cookie: string) => app.inject({ method: 'GET', url: `/api/s/${sb}/account/me`, headers: { cookie } });
  assert.doesNotMatch(String((await login(a!, 'yes')).headers['set-cookie']), /Max-Age/);
  const tokenA = tokenOf(await login(a!), a!);
  const tokenB = tokenOf(await login(b!), b!);
  assert.equal((await me(a!, `account_${a}x=junk; account_${a}=${tokenA}`)).statusCode, 200);
  assert.equal((await me(b!, `account_${b}=${tokenA}`)).statusCode, 401);
  const out = await app.inject({ method: 'POST', url: `/api/s/${a}/account/logout`, headers: { cookie: `account_${a}=${tokenA}` } });
  assert.match(String(out.headers['set-cookie']), /Max-Age=0/);
  const again = tokenOf(await login(a!), a!);
  await app.inject({ method: 'POST', url: `/__test__/s/${a}/reset` });
  assert.equal((await me(a!, `account_${a}=${again}`)).statusCode, 401);
  assert.equal((await me(b!, `account_${b}=${tokenB}`)).statusCode, 200);
});
