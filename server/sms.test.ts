import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('sms: one code per 30 s with Retry-After, the clock hook moves time, reset clears', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const send = () => app.inject({ method: 'POST', url: `/api/s/${sb}/sms` });
  const advance = (ms: number) => app.inject({ method: 'POST', url: `/__test__/s/${sb}/sms-clock`, payload: { advanceMs: ms } });
  assert.deepEqual((await send()).json(), { sent: true, retryAfter: 30 });
  await advance(10_500);
  const limited = await send();
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.headers['retry-after'], '20');
  assert.deepEqual((await app.inject({ method: 'GET', url: `/api/s/${sb}/sms` })).json(), { retryAfter: 20 });
  await advance(19_500);
  assert.equal((await send()).statusCode, 200);
  assert.equal((await advance(-1)).statusCode, 400);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.equal((await send()).statusCode, 200);
});
