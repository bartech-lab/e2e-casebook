import { expect, join, test } from '../fixtures.ts';

test('sign in through the test inbox page; the link works once', async ({ page, sandbox }) => {
  await join(page, sandbox, 'bob', 'account');
  await page.getByLabel('Email').fill('Bob@Example.com');
  await page.getByRole('button', { name: 'Email me a sign-in link' }).click();
  await expect(page.getByRole('status')).toContainText('Bob@Example.com');

  await page.getByRole('link', { name: 'Mail', exact: true }).click();
  await page.getByRole('button', { name: /Your sign-in link — to bob@example.com/ }).click();
  const link = page.getByRole('article', { name: 'Message' }).getByRole('link', { name: 'Sign in to e2e-casebook' });
  const href = await link.getAttribute('href');
  await link.click();
  await expect(page.getByTestId('signed-in-as')).toHaveText('Signed in as bob@example.com');

  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.goto(href!);
  await expect(page.getByRole('alert')).toContainText('invalid or has expired');
});
