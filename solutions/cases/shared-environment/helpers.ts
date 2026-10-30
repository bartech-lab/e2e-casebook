import { expect, type Page } from '@playwright/test';
import { join, type Sandbox } from '../fixtures.ts';

export async function openBoard(page: Page, sandbox: Sandbox) {
  await page.addInitScript(() => localStorage.setItem('variant:createCard', 'inline'));
  await join(page, sandbox, 'alice', 'board');
}

export async function createCard(page: Page, title: string) {
  await page.getByLabel('New card title').fill(title);
  await page.getByRole('button', { name: 'Add card' }).click();
  await expect(page.getByLabel('New card title')).toHaveValue('');
}
