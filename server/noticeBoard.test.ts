import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createNoticeBoard } from './noticeBoard.ts';

test('notices start unread, a read is kept per sandbox, and every send is counted', async () => {
  const board = createNoticeBoard();
  const f = Fastify();
  await f.register(async (scope) => board.register(scope), { prefix: '/api/s/:sandbox' });
  const list = async (s: string) => (await f.inject({ url: `/api/s/${s}/notices` })).json().notices as { id: number; read: boolean }[];
  assert.equal((await list('a')).filter((n) => n.read).length, 0);
  assert.equal((await f.inject({ method: 'POST', url: '/api/s/a/notices/read', payload: { ids: [9] } })).statusCode, 400);
  await f.inject({ method: 'POST', url: '/api/s/a/notices/read', payload: { ids: [2] } });
  await f.inject({ method: 'POST', url: '/api/s/a/notices/read', payload: { ids: [2, 3] } });
  assert.deepEqual((await list('a')).filter((n) => n.read).map((n) => n.id), [2, 3]);
  assert.deepEqual(board.reads('a'), { 2: 2, 3: 1 });
  assert.equal((await list('b')).filter((n) => n.read).length, 0);
});
