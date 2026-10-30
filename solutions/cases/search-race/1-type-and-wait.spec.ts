import { test } from '../fixtures.ts';
import { expect } from '@playwright/test';
import { box, LAMP, openSearch, results, status } from './helpers.ts';

test('results match the text, special characters included', async ({ page, sandbox }) => {
  await openSearch(page, sandbox);
  await box(page).fill('lamp');
  await expect(status(page)).toHaveText('3 results for “lamp”');
  await expect(results(page)).toHaveText(LAMP);

  await box(page).fill('Tea & Coffee');
  await expect(status(page)).toHaveText('1 result for “Tea & Coffee”');
  await expect(results(page)).toHaveText(['Tea & Coffee set']);

  await box(page).fill('zzz');
  await expect(status(page)).toHaveText('No results for “zzz”');
  await expect(results(page)).toHaveCount(0);

  await box(page).fill('');
  await expect(status(page)).toHaveText('');
  await expect(results(page)).toHaveCount(0);
});
