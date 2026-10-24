import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createCardPayments } from './cardPayments.ts';

async function app() {
  const pay = createCardPayments();
  const f = Fastify();
  await f.register(async (scope) => pay.register(scope), { prefix: '/api/s/:sandbox' });
  return f;
}
const charge = (f: Awaited<ReturnType<typeof app>>, sandbox: string, number: string, extra: Record<string, unknown> = {}) =>
  f.inject({ method: 'POST', url: `/api/s/${sandbox}/pay/charge`, payload: { number, expiry: '12/29', cvc: '123', amount: 120, ...extra } });

test('a good card is charged and kept per sandbox', async () => {
  const f = await app();
  const res = await charge(f, 'a', '4242424242424242');
  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.json(), { id: 'PAY-1', amount: 120, last4: '4242' });
  assert.deepEqual((await f.inject({ url: '/api/s/a/pay/payments' })).json().payments.length, 1);
  assert.deepEqual((await f.inject({ url: '/api/s/b/pay/payments' })).json().payments, []);
});

test('the test card 4000000000000002 is declined and nothing is charged', async () => {
  const f = await app();
  const res = await charge(f, 'a', '4000000000000002');
  assert.equal(res.statusCode, 402);
  assert.deepEqual(res.json(), { error: 'Your card was declined.' });
  assert.deepEqual((await f.inject({ url: '/api/s/a/pay/payments' })).json().payments, []);
});

test('malformed details are a 400', async () => {
  const f = await app();
  for (const [n, extra] of [['4242', {}], ['4242424242424242', { expiry: '13/29' }], ['4242424242424242', { cvc: '12' }], ['4242424242424242', { amount: 0 }]] as const)
    assert.equal((await charge(f, 'a', n, extra)).statusCode, 400);
});
