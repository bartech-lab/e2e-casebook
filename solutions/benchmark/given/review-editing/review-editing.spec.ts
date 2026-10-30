import { expect, test, type Page } from '@playwright/test';

async function openPenReviews(page: Page, sandbox: string, name: string) {
  await page.goto(`/s/${sandbox}/shop/pen`);
  await page.getByLabel('Your name').fill(name);
  await page.getByRole('button', { name: 'Join' }).click();
  await expect(page.getByRole('heading', { name: 'Pen reviews' })).toBeVisible();
}

const reviews = (page: Page) => page.getByRole('list', { name: 'Reviews' }).getByRole('listitem');

test.beforeEach(async ({ page, request }) => {
  const res = await request.post('/api/sandboxes');
  expect(res.ok()).toBe(true);
  const { id } = await res.json();
  await openPenReviews(page, id, 'alice');
  await expect(page.getByText('Average rating: 3.0 out of 5 (1 review)')).toBeVisible();
  await page.getByLabel('Rating').selectOption('5');
  await page.getByLabel('Review', { exact: true }).fill('Smooth.');
  await page.getByRole('button', { name: 'Post review' }).click();
  await expect(page.getByText('Average rating: 4.0 out of 5 (2 reviews)')).toBeVisible();
});

test('editing a review updates it', async ({ page }) => {
  const mine = reviews(page).first();
  await mine.getByRole('button', { name: 'Edit' }).click();
  await mine.getByLabel('New rating').selectOption('1');
  await mine.getByLabel('New text').fill('Smooth, then it leaked.');
  await mine.getByRole('button', { name: 'Save' }).click();
  await expect(mine).toContainText('1 out of 5 (edited)');
  await expect(mine).toContainText('Smooth, then it leaked.');
  await expect(page.getByText('Average rating: 2.0 out of 5 (2 reviews)')).toBeVisible();
});

test('another browser cannot edit the review', async ({ page, browser }) => {
  const other = await (await browser.newContext()).newPage();
  await openPenReviews(other, new URL(page.url()).pathname.split('/')[2]!, 'bob');
  await expect(reviews(other).first()).toContainText('Smooth.');
  await expect(reviews(other).first().getByRole('button', { name: 'Edit' })).toHaveCount(0);
});
