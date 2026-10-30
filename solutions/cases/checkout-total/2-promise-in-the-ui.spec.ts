import { expect, test } from '../fixtures.ts';
import { add, applyCode, openShop, placeOrder, summary } from './helpers.ts';

test('VAT on 12.50 PLN rounds half up', async ({ page, sandbox }) => {
  await openShop(page, sandbox);
  await add(page, 'Notebook');
  await expect(summary(page, 'VAT 23%')).toHaveText('2.88 PLN');
  await expect(summary(page, 'Total')).toHaveText('15.38 PLN');
});

test('a code in lower case with spaces is taken off before VAT, and the order charges the total shown', async ({ page, sandbox }) => {
  await openShop(page, sandbox);
  await add(page, 'Notebook');
  await applyCode(page, '  save10 ');
  await expect(summary(page, 'Discount')).toHaveText('−10.00 PLN');
  await expect(summary(page, 'VAT 23%')).toHaveText('0.58 PLN');
  await expect(summary(page, 'Total')).toHaveText('3.08 PLN');
  await expect(await placeOrder(page)).toContainText('Charged 3.08 PLN');
});

test('the discount never takes the subtotal below zero', async ({ page, sandbox }) => {
  await openShop(page, sandbox);
  await add(page, 'Pen');
  await applyCode(page, 'SAVE10');
  await expect(summary(page, 'Discount')).toHaveText('−3.99 PLN');
  await expect(summary(page, 'VAT 23%')).toHaveText('0.00 PLN');
  await expect(summary(page, 'Total')).toHaveText('0.00 PLN');
});
