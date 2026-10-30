import { expect, test, type Page } from '@playwright/test';

const join = async (page: Page) => {
  await page.getByLabel('Your name').fill('shell');
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
};

test('the shell works when the browser blocks storage', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Access is denied for this document.', 'SecurityError');
      },
    });
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-ui', 'dark');
  const { id } = (await (await request.post('/api/sandboxes')).json()) as { id: string };
  await page.goto(`/s/${id}/notes`);
  await join(page);
  expect(errors).toEqual([]);
});

// getByLabel matches substrings, so a shell control labelled "Switch to dark theme" would also answer
// getByLabel('To') on a case page.
test('shell controls are not found by getByLabel', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('header').getByLabel(/./)).toHaveCount(0);
  const { id } = (await (await request.post('/api/sandboxes')).json()) as { id: string };
  await page.goto(`/s/${id}/notes`);
  await join(page);
  await expect(page.getByRole('navigation', { name: 'Sandbox' }).getByLabel(/./)).toHaveCount(0);
});
