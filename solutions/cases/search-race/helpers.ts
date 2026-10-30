import { expect, type Sandbox } from '../fixtures.ts';
import type { Page } from '@playwright/test';

export const LAMP = ['Desk lamp', 'Lava lamp', 'Lamp shade'];

export const box = (page: Page) => page.getByRole('searchbox', { name: 'Search products' });
export const results = (page: Page) => page.getByRole('list', { name: 'Results' }).getByRole('listitem');
export const status = (page: Page) => page.getByRole('status');

export async function openSearch(page: Page, sandbox: Sandbox) {
  await page.goto(`${sandbox.base}/search`);
  await page.getByLabel('Your name').fill('alice');
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(box(page)).toBeVisible();
}
