import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('otp: a code works once, three wrong tries lock it, a new code unlocks', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const send = () => app.inject({ method: 'POST', url: `/api/s/${sb}/otp/send` });
  const verify = (code: string) => app.inject({ method: 'POST', url: `/api/s/${sb}/otp/verify`, payload: { code } });
  const code = async () => (await app.inject({ method: 'GET', url: `/__test__/s/${sb}/otp` })).json().code as string;
  await send();
  const first = await code();
  assert.match(first, /^\d{6}$/);
  assert.equal((await verify(first)).statusCode, 200);
  assert.equal((await verify(first)).statusCode, 400);
  await send();
  const wrong = (await code()) === '000000' ? '111111' : '000000';
  assert.equal((await verify(wrong)).statusCode, 400);
  assert.equal((await verify(wrong)).statusCode, 400);
  assert.equal((await verify(wrong)).statusCode, 429);
  assert.equal((await verify(await code())).statusCode, 429);
  await send();
  assert.equal((await verify(await code())).statusCode, 200);
});
