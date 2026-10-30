import { expect, join, test } from '../fixtures.ts';

test('sign in through the login hook and a cookie, without mail', async ({ page, request, sandbox, baseURL }) => {
  const res = await request.post(`/__test__/s/${sandbox.id}/login`, { data: { email: 'bob@example.com' } });
  const { cookie } = (await res.json()) as { cookie: { name: string; value: string } };
  await page.context().addCookies([{ ...cookie, url: baseURL! }]);
  await join(page, sandbox, 'bob', 'account');
  await expect(page.getByTestId('signed-in-as')).toHaveText('Signed in as bob@example.com');
});
