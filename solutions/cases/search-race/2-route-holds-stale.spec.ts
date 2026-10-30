import { test } from '../fixtures.ts';
import { expect, type Request } from '@playwright/test';
import { box, LAMP, openSearch, results, status } from './helpers.ts';

const isLa = (r: Request) => new URL(r.url()).pathname.startsWith('/api/') && new URL(r.url()).pathname.endsWith('/search') && new URL(r.url()).searchParams.get('q') === 'la';

test('a slow response for older text never replaces newer results', async ({ page, sandbox }) => {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  await page.route(/\/search\?q=la$/, async (route) => {
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response }).catch(() => {});
  });
  await openSearch(page, sandbox);

  const sent = page.waitForRequest(isLa);
  const settled = Promise.race([page.waitForEvent('requestfinished', isLa), page.waitForEvent('requestfailed', isLa)]);
  await box(page).fill('la');
  await sent;
  await box(page).fill('lamp');
  await expect(status(page)).toHaveText('3 results for “lamp”');
  await expect(results(page)).toHaveText(LAMP);

  release();
  await settled;
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await expect(status(page)).toHaveText('3 results for “lamp”');
  await expect(results(page)).toHaveText(LAMP);
});
