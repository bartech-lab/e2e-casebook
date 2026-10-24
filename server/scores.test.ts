import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('scores: goals come from the test hook, and the hook counts reads', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  assert.deepEqual((await app.inject({ method: 'GET', url: `/api/s/${sb}/score` })).json(), { home: 0, away: 0 });
  assert.equal((await app.inject({ method: 'POST', url: `/__test__/s/${sb}/goal`, payload: { team: 'nobody' } })).statusCode, 400);
  assert.deepEqual((await app.inject({ method: 'POST', url: `/__test__/s/${sb}/goal`, payload: { team: 'away' } })).json(), { home: 0, away: 1, reads: 1 });
  await app.inject({ method: 'GET', url: `/api/s/${sb}/score` });
  assert.deepEqual((await app.inject({ method: 'GET', url: `/__test__/s/${sb}/score-reads` })).json(), { reads: 2 });
});
