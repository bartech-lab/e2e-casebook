import { expect, join, type Sandbox } from '../fixtures.ts';
import type { Page } from '@playwright/test';

export async function openTabs(page: Page, sandbox: Sandbox) {
  await join(page, sandbox, 'alice', 'product-tabs');
  await expect(tablist(page)).toBeVisible();
}

export const tablist = (page: Page) => page.getByRole('tablist', { name: 'Product details' });
export const tab = (page: Page, name: string) => tablist(page).getByRole('tab', { name, exact: true });
export const panel = (page: Page) => page.getByRole('tabpanel');
