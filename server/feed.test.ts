import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('feed: 35 seeded posts, cursor and offset paging, newer posts, posting, reset', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const get = async (q = '') => (await app.inject({ method: 'GET', url: `/api/s/${sb}/feed${q}` })).json() as { posts: { id: number }[]; more: boolean };
  const ids = (page: { posts: { id: number }[] }) => page.posts.map((p) => p.id);
  const first = await get();
  assert.deepEqual(ids(first), [35, 34, 33, 32, 31, 30, 29, 28, 27, 26]);
  assert.equal(first.more, true);
  assert.deepEqual(ids(await get('?before=6')), [5, 4, 3, 2, 1]);
  assert.equal((await get('?before=6')).more, false);
  assert.equal((await get('?before=16')).more, true);
  assert.deepEqual(ids(await get('?offset=30')), [5, 4, 3, 2, 1]);
  const posted = await app.inject({ method: 'POST', url: `/api/s/${sb}/feed`, payload: { text: '  Hi  ' } });
  assert.deepEqual(posted.json(), { id: 36, text: 'Hi' });
  assert.equal((await app.inject({ method: 'POST', url: `/api/s/${sb}/feed`, payload: { text: ' ' } })).statusCode, 400);
  assert.deepEqual(ids(await get('?after=35')), [36]);
  assert.deepEqual(ids(await get('?offset=10')).slice(0, 1), [26], 'offset counts the new post');
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.deepEqual(ids(await get('?after=35')), []);
});
