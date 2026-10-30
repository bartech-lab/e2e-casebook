import { expect, type Page } from '@playwright/test';
import { column } from '../fixtures.ts';

export async function createCardInline(page: Page, title: string) {
  await page.getByLabel('New card title').fill(title);
  await page.getByRole('button', { name: 'Add card' }).click();
}

export async function createCardInDialog(page: Page, title: string) {
  await page.getByRole('button', { name: 'New card' }).click();
  const dialog = page.getByRole('dialog', { name: 'New card' });
  await dialog.getByLabel('Title').fill(title);
  await dialog.getByRole('button', { name: 'Create' }).click();
  await expect(dialog).toBeHidden();
}

export async function expectCreated(page: Page, title: string) {
  await expect(column(page, 'To do')).toContainText([title]);
}
