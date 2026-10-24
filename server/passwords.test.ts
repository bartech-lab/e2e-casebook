import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('password change: checks the current password, counts characters by code point, keeps spaces', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const url = `/api/s/${sb}/password`;
  const change = (current: unknown, next: unknown) => app.inject({ method: 'POST', url, payload: { current, next } });
  assert.equal((await change('Blue-Kettle-42', 7)).statusCode, 400);
  assert.equal((await change('blue-kettle-42', 'long enough phrase')).statusCode, 403);
  assert.equal((await change('Blue-Kettle-42', 'elevenchars')).statusCode, 400);
  assert.equal((await change('Blue-Kettle-42', '🔑'.repeat(11))).statusCode, 400);
  assert.equal((await change('Blue-Kettle-42', 'Blue-Kettle-42')).statusCode, 400);
  assert.equal((await change('Blue-Kettle-42', ' twelve chars ')).statusCode, 200);
  assert.equal((await change('twelve chars', 'another phrase')).statusCode, 403);
  assert.equal((await change(' twelve chars ', '🔑'.repeat(12))).statusCode, 200);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.equal((await change('Blue-Kettle-42', 'after the reset')).statusCode, 200);
});
