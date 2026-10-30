import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { WebSocket } from 'ws';
import { CLOSE_DROPPED, CLOSE_UNKNOWN_SANDBOX, createHub } from './hub.ts';
import type { Message } from './store.ts';

function fakeSocket(readyState = 1) {
  const socket = {
    OPEN: 1,
    readyState,
    sent: [] as unknown[],
    closes: [] as number[],
    send(payload: string) {
      if (this.readyState !== 1) throw new Error('send on a socket that is not open');
      this.sent.push(JSON.parse(payload));
    },
    close(code: number) {
      this.closes.push(code);
    },
    on() {},
  };
  return socket;
}

const asWs = (s: ReturnType<typeof fakeSocket>) => s as unknown as WebSocket;
const msg: Message = { seq: 1, name: 'Ann', text: 'hi' };

test('a dropped socket closes with the dropped code, not the reset code that wipes the chat', (t) => {
  const hub = createHub(60_000);
  t.after(() => hub.stop());
  const ann = fakeSocket();
  hub.join('sb', asWs(ann), 'Ann');
  hub.drop('sb', 'Ann');
  assert.deepEqual(ann.closes, [CLOSE_DROPPED]);
});

test('removing a sandbox tells its open sockets it is gone and closes them with the unknown-sandbox code', (t) => {
  const hub = createHub(60_000);
  t.after(() => hub.stop());
  const ann = fakeSocket();
  hub.join('sb', asWs(ann), 'Ann');
  hub.remove('sb');
  assert.deepEqual(ann.sent, [{ type: 'gone' }]);
  assert.deepEqual(ann.closes, [CLOSE_UNKNOWN_SANDBOX]);
});

test('a broadcast skips a socket that is still closing and reaches the open ones', (t) => {
  const hub = createHub(60_000);
  t.after(() => hub.stop());
  const closing = fakeSocket(2);
  const open = fakeSocket();
  hub.join('sb', asWs(closing), 'Ann');
  hub.join('sb', asWs(open), 'Bob');
  hub.broadcast('sb', msg);
  assert.equal(closing.sent.length, 0);
  assert.equal(open.sent.length, 1);
});
