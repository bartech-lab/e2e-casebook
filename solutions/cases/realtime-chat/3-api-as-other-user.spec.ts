import { expect, test } from '../fixtures.ts';
import { joinChat, messages } from '../common.ts';

test('a message posted through the API by another user reaches the open page', async ({ page, sandbox }) => {
  await joinChat(page, sandbox, 'bob');
  await sandbox.post('alice', 'from the API');
  await sandbox.post('alice', 'and again');
  await expect(messages(page)).toHaveText(['alice: from the API', 'alice: and again']);
});
