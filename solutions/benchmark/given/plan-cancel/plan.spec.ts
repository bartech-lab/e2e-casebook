import { expect, test, type Page } from '@playwright/test';

async function openPlan(page: Page) {
  const res = await page.request.post('/api/sandboxes');
  expect(res.ok()).toBe(true);
  const { id } = await res.json();
  await page.goto(`/s/${id}/plan`);
  await page.getByLabel('Your name').fill('alice');
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByRole('heading', { name: 'Subscription' })).toBeVisible();
}

const status = (page: Page) => page.getByText(/^Status:/);
const nextPayment = (page: Page) => page.getByText(/^Next payment:/);

test('cancelling stops the payments', async ({ page }) => {
  await openPlan(page);
  await page.getByRole('button', { name: 'Cancel subscription' }).click();
  await expect(status(page)).toHaveText('Status: Active until 1 December 2026');
  await expect(nextPayment(page)).toHaveText('Next payment: none');
  await page.reload();
  await expect(status(page)).toHaveText('Status: Active until 1 December 2026');
});

test('resuming undoes a cancel', async ({ page }) => {
  await openPlan(page);
  await page.getByRole('button', { name: 'Cancel subscription' }).click();
  await page.getByRole('button', { name: 'Resume subscription' }).click();
  await expect(status(page)).toHaveText('Status: Active');
  await expect(nextPayment(page)).toHaveText('Next payment: 1 December 2026');
});

test('pausing skips one payment', async ({ page }) => {
  await openPlan(page);
  await page.getByRole('button', { name: 'Pause subscription' }).click();
  await expect(status(page)).toHaveText('Status: Paused');
  await expect(nextPayment(page)).toHaveText('Next payment: 1 January 2027');
});
