import { test } from '../fixtures.ts';
import { expect } from '@playwright/test';
import { box, LAMP, openSearch, results, status } from './helpers.ts';

test('one request after 300 ms of quiet, and results keep their own label meanwhile', async ({ page, sandbox }) => {
  const searches: string[] = [];
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (url.pathname.startsWith('/api/') && url.pathname.endsWith('/search')) searches.push(url.searchParams.get('q')!);
  });
  await page.clock.install();
  await openSearch(page, sandbox);

  await box(page).pressSequentially('lamp');
  await page.clock.runFor(299);
  expect(searches).toEqual([]);
  await page.clock.runFor(1);
  await expect(status(page)).toHaveText('3 results for “lamp”');
  await expect(results(page)).toHaveText(LAMP);

  await box(page).press('x');
  await page.clock.runFor(100);
  await expect(status(page)).toHaveText('3 results for “lamp”');
  await expect(results(page)).toHaveText(LAMP);
  await page.clock.runFor(200);
  await expect(status(page)).toHaveText('No results for “lampx”');
  expect(searches).toEqual(['lamp', 'lampx']);
});
