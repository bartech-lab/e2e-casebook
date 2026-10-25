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

test('saved searches: listing waits 200 ms unless a delay is set, clear drops the delay, blank names become untitled, seeds number from 1', async () => {
  const { f, s } = await app();
  const timed = async (sandbox: string) => {
    const start = Date.now();
    const res = await f.inject(`/api/s/${sandbox}/saved-searches`);
    return { ms: Date.now() - start, body: res.json() };
  };
  assert.ok((await timed('a')).ms >= 150, 'default delay');
  s.setDelay('a', 0);
  assert.ok((await timed('a')).ms < 100, 'delay 0');
  s.clear('a');
  assert.ok((await timed('a')).ms >= 150, 'clear restores the default delay');
  s.setDelay('b', 0);
  assert.deepEqual((await f.inject({ method: 'POST', url: '/api/s/b/saved-searches', payload: { name: '   ' } })).json(), { id: 1, name: 'Untitled search 1' });
  s.seed('b', ['Flats', 'Bikes']);
  assert.deepEqual((await timed('b')).body.searches.map((x: { id: number }) => x.id), [1, 2]);
});
