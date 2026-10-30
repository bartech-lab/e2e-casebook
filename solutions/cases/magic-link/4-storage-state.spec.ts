import { request as playwrightRequest } from '@playwright/test';
import { expect, test } from '../fixtures.ts';

let sandboxId = '';
let statePath = '';

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({ browser, baseURL }, testInfo) => {
  const api = await playwrightRequest.newContext({ baseURL });
  sandboxId = ((await (await api.post('/api/sandboxes')).json()) as { id: string }).id;
  await api.post(`/api/s/${sandboxId}/auth/request`, { data: { email: 'bob@example.com' } });
  const [mail] = ((await (await api.get(`/api/s/${sandboxId}/mail`)).json()) as { messages: { link: string }[] }).messages;
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(mail!.link);
  statePath = testInfo.outputPath('bob.json');
  await context.storageState({ path: statePath });
  await context.close();
  await api.dispose();
});

for (const n of [1, 2, 3]) {
  test(`test ${n} reuses the saved sign-in`, async ({ browser }) => {
    const context = await browser.newContext({ storageState: statePath });
    const tab = await context.newPage();
    await tab.goto(`/s/${sandboxId}/account`);
    // storageState keeps cookies and localStorage, not sessionStorage, so the name prompt returns.
    await tab.getByLabel('Your name').fill('bob');
    await tab.getByRole('button', { name: 'Join' }).click();
    await expect(tab.getByTestId('signed-in-as')).toHaveText('Signed in as bob@example.com');
    await context.close();
  });
}
