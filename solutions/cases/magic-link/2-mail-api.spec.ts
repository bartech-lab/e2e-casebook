import { expect, join, test } from '../fixtures.ts';

test('request the link in the page, read it from the mail API', async ({ page, request, sandbox }) => {
  await join(page, sandbox, 'bob', 'account');
  await page.getByLabel('Email').fill('bob@example.com');
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
  await expect(page.getByRole('status')).toBeVisible();

  const mail = await request.get(`/api/s/${sandbox.id}/mail`);
  const [latest] = (await mail.json()).messages as { to: string; link: string }[];
  expect(latest?.to).toBe('bob@example.com');
  await page.goto(latest!.link);
  await expect(page.getByTestId('signed-in-as')).toHaveText('Signed in as bob@example.com');
});
