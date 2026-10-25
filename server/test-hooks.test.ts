import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { registerTestHooks } from './test-hooks.ts';

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
