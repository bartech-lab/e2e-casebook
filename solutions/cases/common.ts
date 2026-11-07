import { expect, test, type Page } from '@playwright/test';
import type { Sandbox } from './fixtures.ts';

export const failsAsShipped = (reason: string) => test.fail(!(process.env.SCORE || process.env.RED), reason);

export async function joinChat(page: Page, sandbox: Sandbox, name: string) {
  await page.goto(sandbox.url);
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByTestId('connection')).toHaveAttribute('data-state', 'open');
}

export async function send(page: Page, text: string) {
  await page.getByLabel('Message', { exact: true }).fill(text);
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByLabel('Message', { exact: true })).toHaveValue('');
}

export const messages = (page: Page) => page.getByRole('list', { name: 'Messages' }).getByRole('listitem');

export async function join(page: Page, sandbox: Sandbox, name: string, path: string) {
  await page.goto(`${sandbox.base}/${path}`);
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Join' }).click();
}

export const column = (page: Page, name: 'To do' | 'Doing' | 'Done') =>
  page.getByRole('region', { name }).getByRole('listitem');

export async function moveCard(page: Page, title: string, to: 'To do' | 'Doing' | 'Done') {
  await page.getByRole('button', { name: `Move “${title}” to ${to}` }).click();
}

export function sharedSandbox(): Sandbox['id'] {
  const id = process.env.SHARED_SANDBOX;
  if (!id) throw new Error('SHARED_SANDBOX is not set; global-setup.ts creates it');
  return id;
}
