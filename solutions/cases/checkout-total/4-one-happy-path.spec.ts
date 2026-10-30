import { expect, test } from '../fixtures.ts';
import { add, applyCode, openShop, placeOrder, summary } from './helpers.ts';

test('a backpack with SAVE10 is charged the discounted total', async ({ page, sandbox }) => {
  await openShop(page, sandbox);
  await add(page, 'Backpack');
  await applyCode(page, 'SAVE10');
  await expect(summary(page, 'VAT 23%')).toHaveText('18.17 PLN');
  await expect(summary(page, 'Total')).toHaveText('97.17 PLN');
  await expect(await placeOrder(page)).toContainText('Charged 97.17 PLN');
});
