import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { registerTestHooks } from './test-hooks.ts';
import { buildApp } from './app.ts';

type Deps = Parameters<typeof registerTestHooks>[1];

function fakeDeps() {
  const taken: string[] = [];
  const cleared = new Map<string, unknown[]>();
  const fake = (name: string) =>
    new Proxy({}, {
      get: (_target, method) => (...args: unknown[]) => {
        if (method === 'clear') cleared.set(name, [...(cleared.get(name) ?? []), args[0]]);
        return method === 'hasSandbox' ? true : undefined;
      },
    });
  const deps = new Proxy({}, {
    get: (_target, name) => {
      taken.push(String(name));
      return fake(String(name));
    },
  }) as Deps;
  return { deps, taken, cleared };
}

test('reset clears every per-sandbox store the test hooks receive, for that sandbox only', async (t) => {
  const { deps, taken, cleared } = fakeDeps();
  const app = Fastify();
  registerTestHooks(app, deps);
  t.after(() => app.close());
  const res = await app.inject({ method: 'POST', url: '/__test__/s/sb1/reset' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json(), { ok: true });
  const stores = taken.filter((name) => name !== 'store' && name !== 'hub');
  assert.ok(stores.length > 50, `only ${stores.length} stores were passed in`);
  assert.deepEqual(stores.filter((name) => JSON.stringify(cleared.get(name)) !== JSON.stringify(['sb1'])), []);
});

async function hookApp(t: { after: (fn: () => Promise<void>) => void }) {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(() => app.close());
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const hook = (path: string, payload?: object) => app.inject({ method: 'POST', url: `/__test__/s/${sb}/${path}`, payload });
  return { app, sb, hook };
}

test('login normalises the email the way the app does and rejects malformed ones', async (t) => {
  const { sb, hook } = await hookApp(t);
  const ok = await hook('login', { email: '  Ann@Example.TEST ' });
  assert.equal(ok.statusCode, 200);
  assert.equal(ok.json().email, 'ann@example.test');
  assert.equal(ok.json().cookie.name, `epg_session_${sb}`);
  for (const email of ['ann@', 'ann example@test.dev', 'ann@test', 42]) {
    assert.equal((await hook('login', { email })).statusCode, 400, String(email));
  }
});

test('a seed whose messages field is not a list adds nothing and is rejected', async (t) => {
  const { app, sb, hook } = await hookApp(t);
  const res = await hook('seed', { messages: { name: 'a', text: 'b' } });
  assert.equal(res.statusCode, 400);
  const listed = await app.inject({ method: 'GET', url: `/api/s/${sb}/messages` });
  assert.deepEqual(listed.json().messages, []);
});

test('clock accepts null to return to real time and rejects negative or non-numeric times', async (t) => {
  const { hook } = await hookApp(t);
  assert.equal((await hook('clock', { nowMs: 1_700_000_000_000 })).statusCode, 200);
  assert.equal((await hook('clock', { nowMs: null })).statusCode, 200);
  for (const nowMs of [-1, 'soon']) {
    assert.equal((await hook('clock', { nowMs })).statusCode, 400, String(nowMs));
  }
});

test('vault-code answers 404 when the sandbox has no vault', async (t) => {
  const { app, sb } = await hookApp(t);
  const res = await app.inject({ method: 'GET', url: `/__test__/s/${sb}/vault-code` });
  assert.equal(res.statusCode, 404);
});

test('assistant pace takes whole milliseconds from 0 to 2000 only', async (t) => {
  const { hook } = await hookApp(t);
  for (const ms of [0, 2000]) assert.equal((await hook('assistant-pace', { ms })).statusCode, 200, String(ms));
  for (const ms of [2001, -1, 1.5]) assert.equal((await hook('assistant-pace', { ms })).statusCode, 400, String(ms));
});
