import { expect, test } from '@playwright/test';

test('the bio cannot be edited until the saved bio has loaded, so nothing typed is lost', async ({ page, request }) => {
  const { id } = (await (await request.post('/api/sandboxes')).json()) as { id: string };
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route(`**/api/s/${id}/bio`, async (route) => {
    if (route.request().method() === 'GET') await held;
    await route.fallback();
  });
  await page.goto(`/s/${id}/bio`);
  await page.getByLabel('Your name', { exact: true }).fill('alice');
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  const bio = page.getByRole('textbox', { name: 'Bio', exact: true });
  await expect(bio).toBeVisible();
  await expect(bio).not.toBeEditable();

  await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'GET' && r.url().endsWith(`/api/s/${id}/bio`)),
    bio.fill('Hello world'),
    release(),
  ]);
  await expect(bio).toHaveText('Hello world');
});
