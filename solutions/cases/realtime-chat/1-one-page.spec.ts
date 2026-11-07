import { expect, test } from '../fixtures.ts';
import { joinChat, messages, send } from '../common.ts';

test('the sender sees their own message exactly once', async ({ page, sandbox }) => {
  await joinChat(page, sandbox, 'alice');
  await send(page, 'hello');
  await send(page, 'second');
  await expect(messages(page)).toHaveText(['alice: hello', 'alice: second']);
});
