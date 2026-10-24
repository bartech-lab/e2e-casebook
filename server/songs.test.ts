import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createSongs } from './songs.ts';

test('a like is applied when its request finishes waiting, so paced requests can land out of order', async () => {
  const songs = createSongs();
  const f = Fastify();
  await f.register(async (scope) => songs.register(scope), { prefix: '/api/s/:sandbox' });
  assert.equal((await f.inject({ url: '/api/s/a/songs' })).json().songs[1].likes, 8);
  assert.equal(songs.setPace('a', [80, 0]), true);
  const put = (liked: boolean) => f.inject({ method: 'PUT', url: '/api/s/a/songs/1/like', payload: { liked } });
  const [first, second] = await Promise.all([put(true), put(false)]);
  assert.equal(first.json().liked, true);
  assert.equal(second.json().liked, false);
  assert.deepEqual(songs.writes('a'), [{ id: 1, liked: false }, { id: 1, liked: true }]);
  songs.setPace('a', []);
  songs.setFail('a', 1);
  assert.equal((await put(false)).statusCode, 503);
  assert.equal((await f.inject({ url: '/api/s/a/songs' })).json().songs[0].liked, true);
  assert.equal((await f.inject({ url: '/api/s/b/songs' })).json().songs[0].liked, false);
});
