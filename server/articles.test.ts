import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('articles: unread by default, marked read per sandbox, unknown ids refused', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const other = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const read = async (id: string) =>
    ((await app.inject({ method: 'GET', url: `/api/s/${id}/articles` })).json().articles as { id: number; read: boolean }[]).filter((a) => a.read).map((a) => a.id);
  assert.deepEqual(await read(sb), []);
  assert.equal((await app.inject({ method: 'POST', url: `/api/s/${sb}/articles/9/read` })).statusCode, 404);
  assert.equal((await app.inject({ method: 'POST', url: `/api/s/${sb}/articles/5/read` })).statusCode, 200);
  await app.inject({ method: 'POST', url: `/api/s/${sb}/articles/5/read` });
  assert.deepEqual(await read(sb), [5]);
  assert.deepEqual(await read(other), []);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.deepEqual(await read(sb), []);
});
