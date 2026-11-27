import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

const shell = readFileSync(new URL('../web/src/sandbox/SandboxShell.tsx', import.meta.url), 'utf8');
const pages = [...new Set([...shell.matchAll(/page === '([a-z0-9-]+)'/g)].map((m) => m[1]!))];

test('the shell lists every page', () => {
  expect(pages.length).toBeGreaterThan(150);
});

for (const name of pages) {
  test(`${name} opens without errors`, async ({ page, request }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const { id } = (await (await request.post('/api/sandboxes')).json()) as { id: string };
    await page.goto(`/s/${id}/${name}`);
    await page.getByLabel('Your name').fill('smoke');
    await page.getByRole('button', { name: 'Join' }).click();
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('/?try=<page> opens a new sandbox on that page, and Back does not open another', async ({ page }) => {
  await page.goto('/?try=chat');
  await expect(page).toHaveURL(/\/s\/[0-9a-f]+\/chat$/);
  await expect(page.getByLabel('Your name', { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('/?try= with an unknown page stays on the landing page', async ({ page }) => {
  await page.goto('/?try=no-such-page');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/\/\?try=no-such-page$/);
});
