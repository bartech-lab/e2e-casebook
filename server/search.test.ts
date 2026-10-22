import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('search: case-insensitive substring, encoded queries, empty returns everything', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const find = async (q: string) => (await app.inject({ method: 'GET', url: `/api/s/${sb}/search?q=${encodeURIComponent(q)}` })).json();
  assert.deepEqual(await find('LAMP'), { q: 'LAMP', results: ['Desk lamp', 'Lava lamp', 'Lamp shade'] });
  assert.deepEqual((await find('Tea & Coffee')).results, ['Tea & Coffee set']);
  assert.deepEqual((await find('zzz')).results, []);
  assert.equal((await find('')).results.length, 12);
});
