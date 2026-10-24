import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createSavedSearches } from './savedSearches.ts';

async function app() {
  const s = createSavedSearches();
  const f = Fastify();
  await f.register(async (scope) => s.register(scope), { prefix: '/api/s/:sandbox' });
  return { f, s };
}

test('creating numbers searches per sandbox; seed replaces', async () => {
  const { f, s } = await app();
  s.setDelay('a', 0);
  s.setDelay('b', 0);
  assert.deepEqual((await f.inject('/api/s/a/saved-searches')).json(), { searches: [] });
  assert.deepEqual((await f.inject({ method: 'POST', url: '/api/s/a/saved-searches' })).json(), { id: 1, name: 'Untitled search 1' });
  s.seed('b', ['Flats in Mokotów', 'Bikes']);
  assert.deepEqual((await f.inject({ method: 'POST', url: '/api/s/b/saved-searches' })).json(), { id: 3, name: 'Untitled search 3' });
  assert.equal((await f.inject('/api/s/a/saved-searches')).json().searches.length, 1);
  assert.deepEqual((await f.inject({ method: 'POST', url: '/api/s/a/saved-searches', payload: { name: ' My first search ' } })).json(), { id: 2, name: 'My first search' });
  s.clear('b');
  assert.deepEqual((await f.inject('/api/s/b/saved-searches')).json(), { searches: [] });
});
