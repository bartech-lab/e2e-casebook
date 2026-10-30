import { expect, joinChat, messages, send, test } from '../fixtures.ts';

test('each user sees the other user’s messages in send order', async ({ browser, sandbox }) => {
  const alice = await (await browser.newContext()).newPage();
  const bob = await (await browser.newContext()).newPage();
  await joinChat(alice, sandbox, 'alice');
  await joinChat(bob, sandbox, 'bob');

  await send(alice, 'one');
  await expect(messages(bob)).toHaveText(['alice: one']);
  await send(bob, 'two');

  const expected = ['alice: one', 'bob: two'];
  await expect(messages(alice)).toHaveText(expected);
  await expect(messages(bob)).toHaveText(expected);
});
