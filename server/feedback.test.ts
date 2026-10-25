import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('feedback: saved in order, validated, reset clears', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const post = (payload: object) => app.inject({ method: 'POST', url: `/api/s/${sb}/feedback`, payload });
  assert.equal((await post({ rating: 4, comment: 'Quick' })).statusCode, 201);
  assert.equal((await post({ rating: 5 })).statusCode, 201);
  for (const bad of [{ rating: 0 }, { rating: 6 }, { rating: 2.5 }, { rating: '4' }, {}, { rating: 3, comment: 'x'.repeat(501) }]) {
    assert.equal((await post(bad)).statusCode, 400, JSON.stringify(bad).slice(0, 40));
  }
  const list = async () => (await app.inject({ method: 'GET', url: `/api/s/${sb}/feedback` })).json().entries;
  assert.deepEqual(await list(), [{ rating: 4, comment: 'Quick' }, { rating: 5, comment: '' }]);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.deepEqual(await list(), []);
});

test('feedback: a 500-character comment is allowed, and the comment must be text', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const send = (comment: unknown) => app.inject({ method: 'POST', url: `/api/s/${sb}/feedback`, payload: { rating: 4, comment } });
  assert.equal((await send('x'.repeat(500))).statusCode, 201);
  assert.equal((await send(42)).statusCode, 400);
});
