import { expect, test } from '../fixtures.ts';

test('quotes and the order follow the pricing promise', async ({ request, sandbox }) => {
  const cart = (path: string, data: unknown) => request.put(`/api/s/${sandbox.id}/cart/${path}`, { data });
  expect((await (await cart('items/notebook', { qty: 1 })).json()).quote).toMatchObject({ vat: 288, total: 1538 });
  const coded = await cart('code', { code: '  save10 ' });
  expect(coded.ok()).toBe(true);
  expect((await coded.json()).quote).toEqual({ subtotal: 1250, discount: 1000, vat: 58, insurance: 0, total: 308 });
  const order = await request.post(`/api/s/${sandbox.id}/orders`);
  expect((await order.json()).quote.total).toBe(308);

  await cart('items/pen', { qty: 1 });
  await cart('code', { code: 'SAVE10' });
  expect((await (await request.get(`/api/s/${sandbox.id}/cart`)).json()).quote).toEqual({ subtotal: 399, discount: 399, vat: 0, insurance: 0, total: 0 });
});
