import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

type App = Awaited<ReturnType<typeof buildApp>>;
type After = { after: (fn: () => Promise<void>) => void };

async function setup(t: After) {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  return { app, sb };
}

const api = (app: App, sb: string, method: string, path: string, payload?: unknown) =>
  app.inject({ method: method as 'GET', url: `/api/s/${sb}${path}`, payload: payload as object | undefined });

async function cart(app: App, sb: string) {
  const r = await api(app, sb, 'GET', '/cart');
  assert.equal(r.statusCode, 200, r.body);
  return r.json();
}

async function setQty(app: App, sb: string, sku: string, qty: unknown) {
  return api(app, sb, 'PUT', `/cart/items/${sku}`, { qty });
}

test('shop: products, and an empty cart quotes zero', async (t) => {
  const { app, sb } = await setup(t);
  const products = (await api(app, sb, 'GET', '/products')).json().products;
  assert.deepEqual(products.map((p: { sku: string; price: number }) => [p.sku, p.price]), [['notebook', 1250], ['pen', 399], ['backpack', 8900]]);
  assert.deepEqual(await cart(app, sb), { lines: [], code: null, insurance: false, quote: { subtotal: 0, discount: 0, vat: 0, insurance: 0, total: 0 } });
});

test('shop: quantities, VAT rounded half up, and line removal', async (t) => {
  const { app, sb } = await setup(t);
  const one = await setQty(app, sb, 'notebook', 1);
  assert.equal(one.statusCode, 200, one.body);
  assert.deepEqual(one.json().quote, { subtotal: 1250, discount: 0, vat: 288, insurance: 0, total: 1538 }, '287.5 rounds up to 288');
  await setQty(app, sb, 'pen', 3);
  const c = await cart(app, sb);
  assert.deepEqual(c.lines.map((l: { sku: string; qty: number; lineTotal: number }) => [l.sku, l.qty, l.lineTotal]), [['notebook', 1, 1250], ['pen', 3, 1197]]);
  assert.deepEqual(c.quote, { subtotal: 2447, discount: 0, vat: 563, insurance: 0, total: 3010 }, '562.81 rounds to 563');
  assert.equal((await setQty(app, sb, 'notebook', 0)).statusCode, 200);
  assert.deepEqual((await cart(app, sb)).lines.map((l: { sku: string }) => l.sku), ['pen'], 'qty 0 removes the line');
  for (const bad of [-1, 1.5, 100, '2', null]) {
    const r = await setQty(app, sb, 'pen', bad);
    assert.equal(r.statusCode, 400, `qty ${JSON.stringify(bad)} -> ${r.statusCode}`);
  }
  assert.equal((await setQty(app, sb, 'pen', 99)).statusCode, 200, '99 is allowed');
  assert.equal((await setQty(app, sb, 'mug', 1)).statusCode, 404);
});

test('shop: discount code is trimmed and case-insensitive, unknown codes are rejected, and it is capped at the subtotal', async (t) => {
  const { app, sb } = await setup(t);
  await setQty(app, sb, 'pen', 1);
  const applied = await api(app, sb, 'PUT', '/cart/code', { code: '  save10 ' });
  assert.equal(applied.statusCode, 200, applied.body);
  assert.equal(applied.json().code, 'SAVE10');
  assert.equal(applied.json().quote.discount, 399, 'the discount never exceeds the subtotal');
  await setQty(app, sb, 'backpack', 1);
  assert.equal((await cart(app, sb)).quote.discount, 1000);
  for (const bad of ['SAVE20', '', 10, true]) {
    const r = await api(app, sb, 'PUT', '/cart/code', { code: bad });
    assert.equal(r.statusCode, 400, `code ${JSON.stringify(bad)} -> ${r.statusCode}`);
  }
  assert.equal((await cart(app, sb)).code, 'SAVE10', 'a rejected code keeps the applied one');
  const removed = await api(app, sb, 'PUT', '/cart/code', { code: null });
  assert.deepEqual([removed.json().code, removed.json().quote.discount], [null, 0]);
});

test('shop: insurance is off by default and adds 4.99 without VAT', async (t) => {
  const { app, sb } = await setup(t);
  await setQty(app, sb, 'notebook', 1);
  const on = await api(app, sb, 'PUT', '/cart/insurance', { on: true });
  assert.equal(on.statusCode, 200, on.body);
  assert.deepEqual(on.json().quote, { subtotal: 1250, discount: 0, vat: 288, insurance: 499, total: 2037 });
  assert.equal((await api(app, sb, 'PUT', '/cart/insurance', { on: 'yes' })).statusCode, 400);
  assert.equal((await cart(app, sb)).insurance, true, 'a rejected body keeps the setting');
  assert.equal((await api(app, sb, 'PUT', '/cart/insurance', { on: false })).json().quote.total, 1538);
});

test('shop: an order charges the cart quote, empties the cart, and reset clears everything per sandbox', async (t) => {
  const { app, sb } = await setup(t);
  const sb2 = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  assert.equal((await api(app, sb, 'POST', '/orders')).statusCode, 400, 'empty cart');
  await setQty(app, sb, 'backpack', 2);
  await api(app, sb, 'PUT', '/cart/insurance', { on: true });
  const quoted = (await cart(app, sb)).quote;
  const placed = await api(app, sb, 'POST', '/orders');
  assert.equal(placed.statusCode, 201, placed.body);
  assert.equal(placed.json().id, 1);
  assert.deepEqual(placed.json().quote, quoted, 'the order charges the quoted total');
  assert.deepEqual((await cart(app, sb)).lines, [], 'the cart is emptied');
  assert.equal((await cart(app, sb)).insurance, false, 'the next cart starts without insurance');
  await setQty(app, sb, 'pen', 1);
  assert.equal((await api(app, sb, 'POST', '/orders')).json().id, 2);
  assert.deepEqual((await api(app, sb, 'GET', '/orders')).json().orders.map((o: { id: number }) => o.id), [1, 2]);
  assert.deepEqual((await api(app, sb2, 'GET', '/orders')).json().orders, [], 'orders leaked to other sandbox');
  await setQty(app, sb, 'pen', 4);
  assert.equal((await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset`, payload: {} })).statusCode, 200);
  assert.deepEqual((await api(app, sb, 'GET', '/orders')).json().orders, [], 'reset clears orders');
  assert.deepEqual((await cart(app, sb)).lines, [], 'reset clears the cart');
});

test('shop: splitting an order gives whole-grosz shares that add up, larger first', async (t) => {
  const { app, sb } = await setup(t);
  const sb2 = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  await setQty(app, sb, 'pen', 3);
  const order = (await api(app, sb, 'POST', '/orders')).json();
  assert.equal(order.quote.total, 1472);
  const split = (people: unknown) => api(app, sb, 'GET', `/orders/${order.id}/split?people=${people}`);
  const three = await split(3);
  assert.equal(three.statusCode, 200, three.body);
  assert.deepEqual(three.json(), { order: 1, total: 1472, people: 3, shares: [491, 491, 490] });
  assert.deepEqual((await split(8)).json().shares, [184, 184, 184, 184, 184, 184, 184, 184]);
  assert.deepEqual((await split(2)).json().shares, [736, 736]);
  for (const bad of [1, 9, 2.5, 'two', '']) assert.equal((await split(bad)).statusCode, 400, `people=${bad}`);
  assert.equal((await api(app, sb, 'GET', '/orders/2/split?people=2')).statusCode, 404, 'unknown order');
  assert.equal((await api(app, sb2, 'GET', `/orders/${order.id}/split?people=2`)).statusCode, 404, 'order from another sandbox');
});
