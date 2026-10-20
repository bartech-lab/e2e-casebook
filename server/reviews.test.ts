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
  const sandbox = async () => (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  return { app, sb: await sandbox(), sandbox };
}

const req = (app: App, sb: string, method: string, path: string, payload?: unknown, headers?: Record<string, string>) =>
  app.inject({ method: method as 'GET', url: `/api/s/${sb}${path}`, payload: payload as object | undefined, headers });

async function list(app: App, sb: string, sku: string) {
  const r = await req(app, sb, 'GET', `/products/${sku}/reviews`);
  assert.equal(r.statusCode, 200, r.body);
  return r.json() as { average: number | null; count: number; reviews: { id: number; name: string; rating: number; text: string; edited: boolean }[] };
}

const post = (app: App, sb: string, sku: string, body: Record<string, unknown>) =>
  req(app, sb, 'POST', `/products/${sku}/reviews`, { name: 'Zoe', rating: 4, text: 'Fine.', ...body });

test('reviews: seeded per product, newest first, with averages', async (t) => {
  const { app, sb } = await setup(t);
  const notebook = await list(app, sb, 'notebook');
  assert.deepEqual([notebook.average, notebook.count], [4.5, 2]);
  assert.deepEqual(notebook.reviews.map((r) => r.name), ['Shop team', 'Marta']);
  assert.equal('token' in notebook.reviews[0]!, false, 'edit tokens must not leak');
  assert.deepEqual([(await list(app, sb, 'pen')).average, (await list(app, sb, 'backpack')).average], [3, null]);
  assert.equal((await req(app, sb, 'GET', '/products/mug/reviews')).statusCode, 404);
});

test('reviews: posting validates rating, text, and name', async (t) => {
  const { app, sb } = await setup(t);
  for (const rating of [0, 6, 2.5, '5', undefined]) {
    assert.equal((await post(app, sb, 'pen', { rating })).statusCode, 400, `rating ${JSON.stringify(rating)}`);
  }
  for (const text of ['', '   ', 'x'.repeat(501), 7]) {
    assert.equal((await post(app, sb, 'pen', { text })).statusCode, 400, `text of length ${String(text).length}`);
  }
  for (const name of ['', ' ', 'n'.repeat(41)]) {
    assert.equal((await post(app, sb, 'pen', { name })).statusCode, 400, `name ${JSON.stringify(name)}`);
  }
  assert.equal((await post(app, sb, 'mug', {})).statusCode, 404);
  assert.equal((await list(app, sb, 'pen')).count, 1, 'rejected reviews must not be stored');
  const ok = await post(app, sb, 'pen', { text: `  ${'x'.repeat(500)}  `, rating: 1, name: '  Ida ' });
  assert.equal(ok.statusCode, 201, ok.body);
  assert.equal(ok.json().text.length, 500, 'text is trimmed and 500 characters are allowed');
  assert.equal(ok.json().name, 'Ida');
  assert.equal(typeof ok.json().editToken, 'string');
});

test('reviews: a new review comes first and the average rounds half up to one decimal', async (t) => {
  const { app, sb } = await setup(t);
  await post(app, sb, 'notebook', { rating: 1, name: 'Ann' });
  let notebook = await list(app, sb, 'notebook');
  assert.equal(notebook.reviews[0]!.name, 'Ann');
  assert.deepEqual([notebook.average, notebook.count], [3.3, 3], '10 / 3');
  await post(app, sb, 'notebook', { rating: 5 });
  notebook = await list(app, sb, 'notebook');
  assert.deepEqual([notebook.average, notebook.count], [3.8, 4], '15 / 4 = 3.75 rounds up');
});

test('reviews: only the author edits, with a valid body, and the review is marked edited', async (t) => {
  const { app, sb, sandbox } = await setup(t);
  const created = (await post(app, sb, 'pen', { text: 'First.' })).json();
  const path = `/products/pen/reviews/${created.id}`;
  assert.equal((await req(app, sb, 'PATCH', path, { text: 'Hacked.' })).statusCode, 403, 'no token');
  assert.equal((await req(app, sb, 'PATCH', path, { text: 'Hacked.' }, { 'x-edit-token': 'nope' })).statusCode, 403, 'wrong token');
  const auth = { 'x-edit-token': created.editToken };
  assert.equal((await req(app, sb, 'PATCH', path, { rating: 9 }, auth)).statusCode, 400);
  assert.equal((await req(app, sb, 'PATCH', path, { text: ' ' }, auth)).statusCode, 400);
  assert.equal((await req(app, sb, 'PATCH', '/products/pen/reviews/999', { text: 'x' }, auth)).statusCode, 404);
  const seeded = (await list(app, sb, 'pen')).reviews.find((r) => r.name === 'Olek')!;
  assert.equal((await req(app, sb, 'PATCH', `/products/pen/reviews/${seeded.id}`, { text: 'x' }, auth)).statusCode, 403, 'a token edits only its own review');
  const edited = await req(app, sb, 'PATCH', path, { text: '  Second.  ' }, auth);
  assert.equal(edited.statusCode, 200, edited.body);
  const mine = (await list(app, sb, 'pen')).reviews.find((r) => r.id === created.id)!;
  assert.deepEqual([mine.text, mine.edited], ['Second.', true]);
  const other = await sandbox();
  assert.equal((await list(app, other, 'pen')).count, 1, 'reviews leaked to another sandbox');
});

test('reviews: reset restores the seeded reviews', async (t) => {
  const { app, sb } = await setup(t);
  await post(app, sb, 'backpack', {});
  assert.equal((await list(app, sb, 'backpack')).count, 1);
  assert.equal((await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset`, payload: {} })).statusCode, 200);
  assert.deepEqual([(await list(app, sb, 'backpack')).count, (await list(app, sb, 'notebook')).count], [0, 2]);
});
