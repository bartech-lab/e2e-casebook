import type { APIRequestContext, Page } from '@playwright/test';

export async function saveDisplayName(page: Page, name: string) {
  await page.getByLabel('Display name').fill(name);
  await page.getByRole('button', { name: 'Save settings' }).click();
}

export async function savedDisplayName(request: APIRequestContext, sandbox: string) {
  return ((await (await request.get(`/api/s/${sandbox}/settings`)).json()) as { displayName: string }).displayName;
}

export const toast = (page: Page) => page.getByRole('status').filter({ hasText: 'Settings saved' });
