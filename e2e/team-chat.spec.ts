import { expect, test } from '@playwright/test';

test('a poll that answers after my send does not show my message twice', async ({ page, request }) => {
  const { id } = (await (await request.post('/api/sandboxes')).json()) as { id: string };
  await page.goto(`/s/${id}/team-chat`);
  await page.getByLabel('Your name', { exact: true }).fill('alice');
  await page.getByRole('button', { name: 'Join', exact: true }).click();
  const log = page.getByRole('log', { name: 'Messages', exact: true });
  await expect(log.getByRole('listitem')).toHaveCount(24);

  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  let holding = false;
  await page.route('**/team-chat?after=*', async (route) => {
    if (holding) return route.fallback();
    holding = true;
    await held;
    await route.fallback();
  });
  await expect.poll(() => holding).toBe(true);

  await page.getByLabel('Message', { exact: true }).fill('On my way');
  await Promise.all([
    page.waitForResponse((r) => r.request().method() === 'POST' && r.url().endsWith('/team-chat')),
    page.getByRole('button', { name: 'Send', exact: true }).click(),
  ]);
  const mine = log.getByRole('listitem').filter({ hasText: 'You: On my way' });
  await expect(mine).toHaveCount(1);

  await Promise.all([page.waitForResponse((r) => r.url().includes('/team-chat?after=')), release()]);
  await expect(log.getByRole('listitem')).toHaveCount(25);
  await expect(mine).toHaveCount(1);
});
