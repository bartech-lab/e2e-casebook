import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('posts: validated, stored per sandbox with questions and the pin, cleared by reset', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const url = `/api/s/${sb}/posts`;
  assert.equal((await app.inject({ method: 'POST', url, payload: { title: ' ', body: '', faq: [], pinned: false } })).statusCode, 400);
  assert.equal((await app.inject({ method: 'POST', url, payload: { title: 'A', body: '', faq: [{ q: 1 }], pinned: false } })).statusCode, 400);
  const res = await app.inject({ method: 'POST', url, payload: { title: ' Hello ', body: 'x', faq: [{ q: 'Why?', a: 'Because.' }, { q: ' ', a: '' }], pinned: true } });
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.json(), { id: 1, title: 'Hello', body: 'x', faq: [{ q: 'Why?', a: 'Because.' }], pinned: true });
  assert.equal((await app.inject({ method: 'GET', url })).json().posts.length, 1);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.deepEqual((await app.inject({ method: 'GET', url })).json(), { posts: [] });
});
