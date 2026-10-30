import fc from 'fast-check';
import { expect, join, test } from '../fixtures.ts';
import type { Page } from '@playwright/test';

const PRODUCTS = { Notebook: 1250, Pen: 399, Backpack: 8900 } as const;
type Product = keyof typeof PRODUCTS;
const NAMES = Object.keys(PRODUCTS) as Product[];

type Step =
  | { kind: 'add' | 'more' | 'less'; product: Product }
  | { kind: 'code'; text: string }
  | { kind: 'removeCode' }
  | { kind: 'place' };

const step: fc.Arbitrary<Step> = fc.oneof(
  { weight: 3, arbitrary: fc.record({ kind: fc.constantFrom('add' as const, 'more' as const, 'less' as const), product: fc.constantFrom(...NAMES) }) },
  { weight: 2, arbitrary: fc.constantFrom('SAVE10', ' save10 ', 'Save10', 'SAVE1').map((text) => ({ kind: 'code' as const, text })) },
  fc.constant<Step>({ kind: 'removeCode' }),
  { weight: 2, arbitrary: fc.constant<Step>({ kind: 'place' }) },
);

const pln = (g: number) => `${(g / 100).toFixed(2)} PLN`;
const summary = (page: Page, label: string) => page.locator(`dl[aria-label="Summary"] dt:text-is("${label}") + dd`);

function quote(cart: Map<Product, number>, code: boolean) {
  const subtotal = [...cart].reduce((sum, [p, q]) => sum + PRODUCTS[p] * q, 0);
  const discount = code ? Math.min(1000, subtotal) : 0;
  const net = subtotal - discount;
  const vat = Math.floor((net * 23 + 50) / 100);
  return { subtotal, discount, vat, total: net + vat };
}

async function expectSummary(page: Page, cart: Map<Product, number>, code: boolean) {
  const q = quote(cart, code);
  await expect(summary(page, 'Subtotal')).toHaveText(pln(q.subtotal));
  if (q.discount > 0) await expect(summary(page, 'Discount')).toHaveText(`−${pln(q.discount)}`);
  else await expect(summary(page, 'Discount')).toHaveCount(0);
  await expect(summary(page, 'VAT 23%')).toHaveText(pln(q.vat));
  await expect(summary(page, 'Total')).toHaveText(pln(q.total));
}

test('random cart sessions match a model of the pricing promises', async ({ page, sandbox }) => {
  await join(page, sandbox, 'alice', 'shop');
  await fc.assert(
    fc.asyncProperty(fc.array(step, { minLength: 1, maxLength: 10 }), async (steps) => {
      await sandbox.reset();
      await page.reload();
      const cart = new Map<Product, number>();
      let code = false;
      let orders = 0;
      for (const s of steps) {
        if (s.kind === 'add') {
          await page.getByRole('button', { name: `Add ${s.product}` }).click();
          cart.set(s.product, (cart.get(s.product) ?? 0) + 1);
        } else if (s.kind === 'more' || s.kind === 'less') {
          const qty = cart.get(s.product);
          if (!qty) continue;
          await page.getByRole('button', { name: `${s.kind === 'more' ? 'One more' : 'One less'} ${s.product}` }).click();
          if (s.kind === 'more') cart.set(s.product, qty + 1);
          else if (qty === 1) cart.delete(s.product);
          else cart.set(s.product, qty - 1);
        } else if (s.kind === 'code') {
          if (code) continue;
          await page.getByLabel('Discount code').fill(s.text);
          await page.getByRole('button', { name: 'Apply' }).click();
          if (s.text.trim().toUpperCase() === 'SAVE10') {
            code = true;
            await expect(page.getByText('Code SAVE10 applied.')).toBeVisible();
          } else {
            await expect(page.getByRole('alert')).toBeVisible();
          }
        } else if (s.kind === 'removeCode') {
          if (!code) continue;
          await page.getByRole('button', { name: 'Remove code' }).click();
          code = false;
          await expect(page.getByLabel('Discount code')).toBeVisible();
        } else {
          if (!cart.size) continue;
          const charged = quote(cart, code).total;
          await page.getByRole('button', { name: 'Place order' }).click();
          orders++;
          await expect(page.getByRole('status')).toHaveText(`Order #${orders} placed. Charged ${pln(charged)}.`);
          cart.clear();
          code = false;
          await expect(page.getByText('Your cart is empty.')).toBeVisible();
        }
        await expectSummary(page, cart, code);
      }
    }),
    { seed: 20261022, numRuns: 40, endOnFailure: true },
  );
});
