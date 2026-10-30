import { expect, join, test } from '../fixtures.ts';

const title = (page: import('@playwright/test').Page) => page.getByLabel('Title');

test('a stale save shows the conflict, and Keep mine wins', async ({ browser, sandbox }) => {
  const alice = await (await browser.newContext()).newPage();
  const bob = await (await browser.newContext()).newPage();
  await join(alice, sandbox, 'alice', 'cards/1');
  await join(bob, sandbox, 'bob', 'cards/1');
  await expect(title(bob)).toHaveValue('Write the release notes');

  await title(alice).fill('Alice title');
  await alice.getByRole('button', { name: 'Save' }).click();
  await expect(alice.getByRole('status')).toHaveText('Saved.');

  await title(bob).fill('Bob title');
  await bob.getByRole('button', { name: 'Save' }).click();
  const conflict = bob.getByRole('alert', { name: 'Conflict' });
  await expect(conflict).toContainText('alice changed this card');
  await expect(conflict).toContainText('Alice title');

  await conflict.getByRole('button', { name: 'Keep mine' }).click();
  await expect(bob.getByRole('status')).toHaveText('Saved.');
  expect(await sandbox.card(1)).toMatchObject({ title: 'Bob title', version: 3, updatedBy: 'bob' });
});

test('Use theirs replaces my draft with the newer version', async ({ browser, sandbox }) => {
  const alice = await (await browser.newContext()).newPage();
  const bob = await (await browser.newContext()).newPage();
  await join(alice, sandbox, 'alice', 'cards/1');
  await join(bob, sandbox, 'bob', 'cards/1');
  await expect(title(bob)).toHaveValue('Write the release notes');

  await title(alice).fill('Alice title');
  await alice.getByRole('button', { name: 'Save' }).click();
  await expect(alice.getByRole('status')).toHaveText('Saved.');

  await title(bob).fill('Bob title');
  await bob.getByRole('button', { name: 'Save' }).click();
  await bob.getByRole('alert', { name: 'Conflict' }).getByRole('button', { name: 'Use theirs' }).click();
  await expect(title(bob)).toHaveValue('Alice title');
  await bob.getByLabel('Description').fill('Bob adds a description');
  await bob.getByRole('button', { name: 'Save' }).click();
  await expect(bob.getByRole('status')).toHaveText('Saved.');
  expect(await sandbox.card(1)).toMatchObject({ title: 'Alice title', description: 'Bob adds a description', version: 3 });
});
