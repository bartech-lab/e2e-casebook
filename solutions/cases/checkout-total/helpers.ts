import { expect, join, type Sandbox } from '../fixtures.ts';
import type { Page } from '@playwright/test';

export async function openShop(page: Page, sandbox: Sandbox) {
  await join(page, sandbox, 'alice', 'shop');
  await expect(page.getByRole('heading', { name: 'Shop' })).toBeVisible();
}

export async function add(page: Page, product: 'Notebook' | 'Pen' | 'Backpack') {
  await page.getByRole('button', { name: `Add ${product}` }).click();
  await expect(page.getByRole('table', { name: 'Cart' }).getByRole('row').filter({ hasText: product })).toBeVisible();
}

export async function applyCode(page: Page, code: string) {
  await page.getByLabel('Discount code').fill(code);
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByText('Code SAVE10 applied.')).toBeVisible();
}

export const summary = (page: Page, term: string) =>
  page.locator('dl[aria-label="Summary"]').locator(`dt:text-is("${term}") + dd`);

export async function placeOrder(page: Page) {
  await page.getByRole('button', { name: 'Place order' }).click();
  return page.getByRole('status').filter({ hasText: /^Order #\d+ placed/ });
}
