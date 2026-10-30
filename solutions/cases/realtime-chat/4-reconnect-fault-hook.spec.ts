import { expect, joinChat, messages, send, test } from '../fixtures.ts';

test('after the server drops the socket, the page reconnects and replays what it missed', async ({
  browser,
  sandbox,
}) => {
  const alice = await (await browser.newContext()).newPage();
  const bob = await (await browser.newContext()).newPage();
  await bob.clock.install();
  await joinChat(alice, sandbox, 'alice');
  await joinChat(bob, sandbox, 'bob');
  await send(alice, 'before');
  await expect(messages(bob)).toHaveText(['alice: before']);

  // Freeze Bob's timers so his reconnect waits until Alice has sent while he is offline.
  await bob.clock.pauseAt(Date.now() + 1000);
  await sandbox.fault({ dropSockets: 'bob' });
  // Locally the close frame arrives at once; behind a proxy that swallows it, only the
  // client's 12 s silence watchdog notices. Step under the 300 ms reconnect delay so the
  // offline window is never skipped.
  const connection = bob.getByTestId('connection');
  for (let waited = 0; (await connection.getAttribute('data-state')) !== 'closed'; waited += 250) {
    expect(waited, 'bob never noticed the drop').toBeLessThan(15_000);
    await bob.clock.runFor(250);
  }
  await send(alice, 'missed 1');
  await send(alice, 'missed 2');
  await expect(messages(bob)).toHaveText(['alice: before']);

  await bob.clock.resume();
  await expect(bob.getByTestId('connection')).toHaveAttribute('data-state', 'open');
  await expect(messages(bob)).toHaveText(['alice: before', 'alice: missed 1', 'alice: missed 2']);
});
