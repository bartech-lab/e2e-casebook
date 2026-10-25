import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

type App = Awaited<ReturnType<typeof buildApp>>;

const MSG = 'An order needs 1 to 99 of each tile, each tile once.';

async function makeApp(t: { after: (fn: () => Promise<void>) => void }): Promise<App> {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  return app;
}

async function newSandbox(app: App): Promise<string> {
  const res = await app.inject({ method: 'POST', url: '/api/sandboxes' });
  assert.equal(res.statusCode, 201, `create sandbox: ${res.body}`);
  return res.json().id;
}

async function setup(t: { after: (fn: () => Promise<void>) => void }) {
  const app = await makeApp(t);
  const sb = await newSandbox(app);
  return { app, sb };
}

function api(app: App, sb: string, method: string, path: string, payload?: unknown) {
  return app.inject({
    method: method as 'GET',
    url: `/api/s/${sb}${path}`,
    payload: payload as object | undefined,
  });
}

function hook(app: App, sb: string, op: string, payload?: unknown) {
  return app.inject({ method: 'POST', url: `/__test__/s/${sb}/${op}`, payload: (payload ?? {}) as object });
}

async function listOrders(app: App, sb: string) {
  const res = await api(app, sb, 'GET', '/tile-orders');
  assert.equal(res.statusCode, 200, res.body);
  return res.json().orders as any[];
}

test('empty sandbox lists no orders', async (t) => {
  const { app, sb } = await setup(t);
  assert.deepEqual(await listOrders(app, sb), []);
});

test('single line order returns 201 with id, lines and total', async (t) => {
  const { app, sb } = await setup(t);
  const res = await api(app, sb, 'POST', '/tile-orders', { lines: [{ tile: 'white-matt', qty: 1 }] });
  assert.equal(res.statusCode, 201, res.body);
  assert.deepEqual(res.json(), { id: 1, lines: [{ tile: 'white-matt', qty: 1 }], total: 89 });
});

test('each tile uses its own price', async (t) => {
  const { app, sb } = await setup(t);
  const prices: Record<string, number> = { 'white-matt': 89, terracotta: 129, 'blue-metro': 149 };
  for (const [tile, price] of Object.entries(prices)) {
    const res = await api(app, sb, 'POST', '/tile-orders', { lines: [{ tile, qty: 1 }] });
    assert.equal(res.statusCode, 201, res.body);
    assert.equal(res.json().total, price, tile);
  }
});

test('multi-line total sums price times qty across every line', async (t) => {
  const { app, sb } = await setup(t);
  const res = await api(app, sb, 'POST', '/tile-orders', {
    lines: [
      { tile: 'blue-metro', qty: 3 },
      { tile: 'white-matt', qty: 2 },
      { tile: 'terracotta', qty: 5 },
    ],
  });
  assert.equal(res.statusCode, 201, res.body);
  assert.equal(res.json().total, 149 * 3 + 89 * 2 + 129 * 5);
  assert.deepEqual(res.json().lines, [
    { tile: 'blue-metro', qty: 3 },
    { tile: 'white-matt', qty: 2 },
    { tile: 'terracotta', qty: 5 },
  ]);
});

test('lines echo only tile and qty; extra fields are dropped', async (t) => {
  const { app, sb } = await setup(t);
  const res = await api(app, sb, 'POST', '/tile-orders', {
    lines: [
      { tile: 'terracotta', qty: 2, price: 1, note: 'x' },
      { tile: 'white-matt', qty: 1, total: 0 },
    ],
    extra: true,
  });
  assert.equal(res.statusCode, 201, res.body);
  assert.deepEqual(res.json().lines, [
    { tile: 'terracotta', qty: 2 },
    { tile: 'white-matt', qty: 1 },
  ]);
  assert.equal(res.json().total, 129 * 2 + 89);
  const listed = await listOrders(app, sb);
  assert.deepEqual(listed[0].lines, res.json().lines);
});

test('qty boundaries: 1 and 99 are allowed, 0 and 100 are rejected', async (t) => {
  const { app, sb } = await setup(t);
  const lo = await api(app, sb, 'POST', '/tile-orders', { lines: [{ tile: 'white-matt', qty: 1 }] });
  assert.equal(lo.statusCode, 201);
  const hi = await api(app, sb, 'POST', '/tile-orders', { lines: [{ tile: 'white-matt', qty: 99 }] });
  assert.equal(hi.statusCode, 201, hi.body);
  assert.equal(hi.json().total, 89 * 99);
  for (const qty of [0, 100, -1]) {
    const res = await api(app, sb, 'POST', '/tile-orders', { lines: [{ tile: 'white-matt', qty }] });
    assert.equal(res.statusCode, 400, `qty ${qty}`);
    assert.deepEqual(res.json(), { error: MSG });
  }
  assert.equal((await listOrders(app, sb)).length, 2);
});

test('non-integer or non-number qty is rejected', async (t) => {
  const { app, sb } = await setup(t);
  for (const qty of [1.5, '2', null, true]) {
    const res = await api(app, sb, 'POST', '/tile-orders', { lines: [{ tile: 'white-matt', qty }] });
    assert.equal(res.statusCode, 400, `qty ${JSON.stringify(qty)}`);
    assert.deepEqual(res.json(), { error: MSG });
  }
  const missing = await api(app, sb, 'POST', '/tile-orders', { lines: [{ tile: 'white-matt' }] });
  assert.equal(missing.statusCode, 400);
  assert.deepEqual(missing.json(), { error: MSG });
});

test('an invalid second line rejects the whole order', async (t) => {
  const { app, sb } = await setup(t);
  const badBodies = [
    { lines: [{ tile: 'white-matt', qty: 1 }, { tile: 'terracotta', qty: 100 }] },
    { lines: [{ tile: 'white-matt', qty: 1 }, { tile: 'marble', qty: 1 }] },
    { lines: [{ tile: 'white-matt', qty: 1 }, { tile: 'terracotta', qty: 1.5 }] },
    { lines: [{ tile: 'white-matt', qty: 1 }, null] },
    { lines: [{ tile: 'white-matt', qty: 1 }, 'terracotta'] },
  ];
  for (const body of badBodies) {
    const res = await api(app, sb, 'POST', '/tile-orders', body);
    assert.equal(res.statusCode, 400, JSON.stringify(body));
    assert.deepEqual(res.json(), { error: MSG });
  }
  assert.deepEqual(await listOrders(app, sb), []);
});

test('missing, non-array, empty lines and bad line shapes are 400', async (t) => {
  const { app, sb } = await setup(t);
  const bodies: unknown[] = [
    {},
    { lines: null },
    { lines: 'white-matt' },
    { lines: { tile: 'white-matt', qty: 1 } },
    { lines: 5 },
    { lines: [] },
    { lines: [null] },
    { lines: [5] },
    { lines: ['white-matt'] },
    { lines: [{ tile: 'nope', qty: 1 }] },
    { lines: [{ qty: 1 }] },
  ];
  for (const body of bodies) {
    const res = await api(app, sb, 'POST', '/tile-orders', body);
    assert.equal(res.statusCode, 400, JSON.stringify(body));
    assert.deepEqual(res.json(), { error: MSG });
  }
  assert.deepEqual(await listOrders(app, sb), []);
});

test('the same tile twice is rejected even when it is not adjacent', async (t) => {
  const { app, sb } = await setup(t);
  const adjacent = await api(app, sb, 'POST', '/tile-orders', {
    lines: [{ tile: 'terracotta', qty: 1 }, { tile: 'terracotta', qty: 2 }],
  });
  assert.equal(adjacent.statusCode, 400);
  assert.deepEqual(adjacent.json(), { error: MSG });
  const apart = await api(app, sb, 'POST', '/tile-orders', {
    lines: [{ tile: 'terracotta', qty: 1 }, { tile: 'white-matt', qty: 1 }, { tile: 'terracotta', qty: 1 }],
  });
  assert.equal(apart.statusCode, 400);
  assert.deepEqual(apart.json(), { error: MSG });
  assert.deepEqual(await listOrders(app, sb), []);
});

test('ids go up by 1, a rejected order does not consume an id, list keeps creation order', async (t) => {
  const { app, sb } = await setup(t);
  const a = await api(app, sb, 'POST', '/tile-orders', { lines: [{ tile: 'white-matt', qty: 1 }] });
  const bad = await api(app, sb, 'POST', '/tile-orders', { lines: [] });
  const b = await api(app, sb, 'POST', '/tile-orders', { lines: [{ tile: 'blue-metro', qty: 2 }] });
  const c = await api(app, sb, 'POST', '/tile-orders', { lines: [{ tile: 'terracotta', qty: 3 }] });
  assert.equal(bad.statusCode, 400);
  assert.deepEqual([a.json().id, b.json().id, c.json().id], [1, 2, 3]);
  const orders = await listOrders(app, sb);
  assert.deepEqual(orders.map((o) => o.id), [1, 2, 3]);
  assert.deepEqual(orders.map((o) => o.total), [89, 298, 387]);
});

test('reset clears orders and ids restart at 1', async (t) => {
  const { app, sb } = await setup(t);
  await api(app, sb, 'POST', '/tile-orders', { lines: [{ tile: 'white-matt', qty: 1 }] });
  await api(app, sb, 'POST', '/tile-orders', { lines: [{ tile: 'white-matt', qty: 1 }] });
  const res = await hook(app, sb, 'reset');
  assert.ok(res.statusCode < 300, res.body);
  assert.deepEqual(await listOrders(app, sb), []);
  const next = await api(app, sb, 'POST', '/tile-orders', { lines: [{ tile: 'terracotta', qty: 1 }] });
  assert.equal(next.json().id, 1);
});

test('orders and ids are per sandbox', async (t) => {
  const app = await makeApp(t);
  const a = await newSandbox(app);
  const b = await newSandbox(app);
  await api(app, a, 'POST', '/tile-orders', { lines: [{ tile: 'white-matt', qty: 1 }] });
  await api(app, a, 'POST', '/tile-orders', { lines: [{ tile: 'white-matt', qty: 2 }] });
  assert.deepEqual(await listOrders(app, b), []);
  const first = await api(app, b, 'POST', '/tile-orders', { lines: [{ tile: 'blue-metro', qty: 1 }] });
  assert.equal(first.json().id, 1);
  assert.equal((await listOrders(app, a)).length, 2);
  await hook(app, b, 'reset');
  assert.equal((await listOrders(app, a)).length, 2);
});
