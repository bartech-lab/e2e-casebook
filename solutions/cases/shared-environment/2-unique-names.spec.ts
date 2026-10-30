import { randomUUID } from 'node:crypto';
import { column, expect, test } from '../fixtures.ts';
import { createCard, openBoard } from './helpers.ts';

test('create a uniquely named card in the shared sandbox and find only it', async ({ page, shared }, testInfo) => {
  const title = `Release checklist w${testInfo.workerIndex} ${randomUUID().slice(0, 8)}`;
  await openBoard(page, shared);
  await createCard(page, title);
  await page.getByLabel('Search cards').fill(title);
  await expect(page.getByTestId('card-count')).toHaveText('1 card');
  await expect(column(page, 'To do')).toHaveText([new RegExp(title)]);
});
