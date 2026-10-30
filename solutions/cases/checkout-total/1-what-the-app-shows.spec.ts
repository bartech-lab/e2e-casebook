import { expect, test } from '../fixtures.ts';
import { add, applyCode, openShop, placeOrder, summary } from './helpers.ts';

// Expected values copied from what the shipped app shows, as a test written from the app would be.
test('a notebook with SAVE10 costs what the summary shows', async ({ page, sandbox }) => {
  await openShop(page, sandbox);
  await add(page, 'Notebook');
  await applyCode(page, 'SAVE10');
  await expect(summary(page, 'VAT 23%')).toHaveText('2.88 PLN');
  await expect(summary(page, 'Total')).toHaveText('5.38 PLN');
  await expect(await placeOrder(page)).toContainText('Charged 5.38 PLN');
});

test('a pen with SAVE10 costs what the summary shows', async ({ page, sandbox }) => {
  await openShop(page, sandbox);
  await add(page, 'Pen');
  await applyCode(page, 'SAVE10');
  await expect(summary(page, 'Discount')).toHaveText('−3.99 PLN');
  await expect(summary(page, 'Total')).toHaveText('0.92 PLN');
});
