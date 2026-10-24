import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createStudyGroup } from './studyGroup.ts';

test('typing signals are counted per sandbox, and a message needs a name and text', async () => {
  const group = createStudyGroup();
  const f = Fastify();
  await f.register(async (scope) => group.register(scope), { prefix: '/api/s/:sandbox' });
  const post = (url: string, payload: unknown) => f.inject({ method: 'POST', url: `/api/s/a/study-group/${url}`, payload: payload as object });
  assert.equal((await post('typing', {})).statusCode, 400);
  assert.equal((await post('typing', { name: 'Ola' })).statusCode, 200);
  assert.equal((await post('typing', { name: 'Ola' })).statusCode, 200);
  assert.equal(group.signals('a'), 2);
  assert.equal(group.signals('b'), 0);
  assert.equal((await post('messages', { name: 'Ola', text: '  ' })).statusCode, 400);
  assert.deepEqual((await post('messages', { name: 'Ola', text: ' Page 12? ' })).json(), { id: 1, name: 'Ola', text: 'Page 12?' });
  group.clear('a');
  await f.close();
});
