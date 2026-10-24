import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createWorkspaces } from './workspaces.ts';

async function app() {
  const ws = createWorkspaces();
  const f = Fastify();
  await f.register(async (scope) => ws.register(scope), { prefix: '/api/s/:sandbox' });
  return { f, ws };
}

test('settings answer after the delay and finishing setup sticks', async () => {
  const { f, ws } = await app();
  ws.set('a', { setupDone: false, delayMs: 50 });
  const started = Date.now();
  assert.deepEqual((await f.inject('/api/s/a/workspace')).json(), { name: 'Bakery Kowalski', setupDone: false });
  assert.ok(Date.now() - started >= 45);
  await f.inject({ method: 'POST', url: '/api/s/a/workspace/finish-setup' });
  assert.equal((await f.inject('/api/s/a/workspace')).json().setupDone, true);
  assert.equal((await f.inject('/api/s/b/workspace')).json().setupDone, true);
});

test('set and clear', async () => {
  const { ws } = await app();
  assert.deepEqual(ws.set('a', { delayMs: 0 }), { setupDone: true, delayMs: 0 });
  assert.deepEqual(ws.set('a', { setupDone: false }), { setupDone: false, delayMs: 0 });
  ws.clear('a');
  assert.deepEqual(ws.set('a', {}), { setupDone: true, delayMs: 300 });
});
