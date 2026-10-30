import { expect, joinChat, messages, test } from '../fixtures.ts';

test('a message posted through the API by another user reaches the open page', async ({ page, sandbox }) => {
  await joinChat(page, sandbox, 'bob');
  await sandbox.post('alice', 'from the API');
  await sandbox.post('alice', 'and again');
  await expect(messages(page)).toHaveText(['alice: from the API', 'alice: and again']);
});
