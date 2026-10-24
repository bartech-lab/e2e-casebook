import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';

test('price list: strong ETag, 304 for a matching If-None-Match, a new ETag after a price change, a request log', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const url = `/api/s/${sb}/price-list`;
  const first = await app.inject({ method: 'GET', url });
  assert.equal(first.statusCode, 200);
  assert.equal(first.headers['cache-control'], 'no-cache');
  const etag = first.headers.etag as string;
  assert.match(etag, /^"[0-9a-f]{16}"$/);
  const again = await app.inject({ method: 'GET', url, headers: { 'if-none-match': `"other", ${etag}` } });
  assert.equal(again.statusCode, 304);
  assert.equal(again.body, '');
  assert.equal((await app.inject({ method: 'POST', url: `/__test__/s/${sb}/price-list`, payload: { sku: 'nope', price: 1 } })).statusCode, 404);
  assert.equal((await app.inject({ method: 'POST', url: `/__test__/s/${sb}/price-list`, payload: { sku: 'mug', price: 3950 } })).statusCode, 200);
  const changed = await app.inject({ method: 'GET', url, headers: { 'if-none-match': etag } });
  assert.equal(changed.statusCode, 200);
  assert.notEqual(changed.headers.etag, etag);
  const log = (await app.inject({ method: 'GET', url: `/__test__/s/${sb}/price-list-requests` })).json();
  assert.deepEqual(log.requests.map((r: { status: number }) => r.status), [200, 304, 200]);
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.deepEqual((await app.inject({ method: 'GET', url: `/__test__/s/${sb}/price-list-requests` })).json(), { requests: [] });
});
