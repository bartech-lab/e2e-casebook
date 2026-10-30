import { expect, joinChat, messages, test } from '../fixtures.ts';

const msg = (seq: number, text: string) => JSON.stringify({ type: 'msg', seq, name: 'alice', text });

test('pushes arriving out of order and twice render once, in seq order', async ({ page, sandbox }) => {
  await page.routeWebSocket(/\/ws\?/, (ws) => {
    ws.send(msg(2, 'second'));
    ws.send(msg(1, 'first'));
    ws.send(msg(2, 'second'));
    ws.send(JSON.stringify({ type: 'ready' }));
  });
  await joinChat(page, sandbox, 'bob');
  await expect(messages(page)).toHaveText(['alice: first', 'alice: second']);
});

test('a reset push clears the list', async ({ page, sandbox }) => {
  let server: { send(data: string): void } | undefined;
  await page.routeWebSocket(/\/ws\?/, (ws) => {
    server = ws;
    ws.send(msg(1, 'old'));
    ws.send(JSON.stringify({ type: 'ready' }));
  });
  await joinChat(page, sandbox, 'bob');
  await expect(messages(page)).toHaveText(['alice: old']);
  server!.send(JSON.stringify({ type: 'reset' }));
  await expect(messages(page)).toHaveCount(0);
});
