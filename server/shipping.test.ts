import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from './app.ts';
import { checkAddress } from './shipping.ts';

test('checkAddress: postcodes per country, state only for US, UK normalised', () => {
  assert.deepEqual(checkAddress({ country: 'PL', postcode: '80-001' }), { country: 'PL', postcode: '80-001' });
  assert.equal(typeof checkAddress({ country: 'PL', postcode: '80001' }), 'string');
  assert.deepEqual(checkAddress({ country: 'US', postcode: '94105-1234', state: 'CA' }), { country: 'US', postcode: '94105-1234', state: 'CA' });
  assert.equal(typeof checkAddress({ country: 'US', postcode: '94105' }), 'string');
  assert.deepEqual(checkAddress({ country: 'UK', postcode: 'sw1a1aa' }), { country: 'UK', postcode: 'SW1A 1AA' });
  assert.equal(typeof checkAddress({ country: 'UK', postcode: 'SW1A 1AA', state: 'CA' }), 'string');
  assert.equal(typeof checkAddress({ country: 'DE', postcode: '10115' }), 'string');
});

test('shipping: saved through the API, rejected with 400, reset clears', async (t) => {
  const app = await buildApp({ dbPath: ':memory:', testHooks: true });
  t.after(async () => {
    await app.close();
  });
  const sb = (await app.inject({ method: 'POST', url: '/api/sandboxes' })).json().id as string;
  const put = (payload: object) => app.inject({ method: 'PUT', url: `/api/s/${sb}/shipping`, payload });
  assert.equal((await put({ country: 'PL', postcode: '8000' })).statusCode, 400);
  assert.deepEqual((await put({ country: 'UK', postcode: 'ec1a 1bb' })).json(), { address: { country: 'UK', postcode: 'EC1A 1BB' } });
  await app.inject({ method: 'POST', url: `/__test__/s/${sb}/reset` });
  assert.deepEqual((await app.inject({ method: 'GET', url: `/api/s/${sb}/shipping` })).json(), { address: null });
});
