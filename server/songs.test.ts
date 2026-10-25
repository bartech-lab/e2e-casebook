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

test('song likes: unknown song is 404, liked must be a boolean, failures run out, hooks validate, clear restores', async () => {
  const songs = createSongs();
  const f = Fastify();
  await f.register(async (scope) => songs.register(scope), { prefix: '/api/s/:sandbox' });
  const put = (id: number, liked: unknown) => f.inject({ method: 'PUT', url: `/api/s/a/songs/${id}/like`, payload: { liked } });
  assert.equal((await put(9, true)).statusCode, 404);
  assert.equal((await put(1, 'true')).statusCode, 400);
  assert.equal(songs.setFail('a', 2), true);
  assert.equal((await put(1, true)).statusCode, 503);
  assert.equal((await put(1, true)).statusCode, 503);
  assert.equal((await put(1, true)).statusCode, 200);
  assert.equal(songs.setFail('a', -1), false);
  assert.equal(songs.setFail('a', 1.5), false);
  assert.equal(songs.setPace('a', [10_001]), false);
  assert.equal(songs.setPace('a', [-1]), false);
  songs.clear('a');
  assert.equal((await f.inject({ url: '/api/s/a/songs' })).json().songs[0].liked, false);
  assert.deepEqual(songs.writes('a'), []);
});

test('setting a new pace list starts again from its first entry', async () => {
  const songs = createSongs();
  const f = Fastify();
  await f.register(async (scope) => songs.register(scope), { prefix: '/api/s/:sandbox' });
  const put = (liked: boolean) => f.inject({ method: 'PUT', url: '/api/s/a/songs/2/like', payload: { liked } });
  songs.setPace('a', [0, 300]);
  await put(true);
  songs.setPace('a', [0, 300]);
  const start = Date.now();
  await put(false);
  assert.ok(Date.now() - start < 200, 'the first entry of the new list (0 ms) should apply');
});
