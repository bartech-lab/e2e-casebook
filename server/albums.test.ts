import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { createAlbums } from './albums.ts';

async function app() {
  const albums = createAlbums();
  const f = Fastify();
  await f.register(async (scope) => albums.register(scope), { prefix: '/api/s/:sandbox' });
  return { f, albums };
}

test('an upload replaces the album and keeps only path and size', async () => {
  const { f } = await app();
  const post = (photos: unknown) => f.inject({ method: 'POST', url: '/api/s/a/album', payload: { photos } });
  assert.equal((await post([{ path: 'day1/a.jpg', size: 3, extra: 1 }])).statusCode, 200);
  assert.deepEqual((await f.inject('/api/s/a/album')).json(), { photos: [{ path: 'day1/a.jpg', size: 3 }] });
  await post([{ path: 'b.png', size: 0 }]);
  assert.deepEqual((await f.inject('/api/s/a/album')).json(), { photos: [{ path: 'b.png', size: 0 }] });
  assert.deepEqual((await f.inject('/api/s/b/album')).json(), { photos: [] });
});

test('bad uploads are refused', async () => {
  const { f, albums } = await app();
  for (const photos of [[], [{ path: '', size: 1 }], [{ path: 'a', size: -1 }], [{ path: 'a', size: 1.5 }], 'x', Array.from({ length: 201 }, (_, i) => ({ path: `${i}`, size: 1 }))]) {
    assert.equal((await f.inject({ method: 'POST', url: '/api/s/a/album', payload: { photos } })).statusCode, 400);
  }
  await f.inject({ method: 'POST', url: '/api/s/a/album', payload: { photos: [{ path: 'a', size: 1 }] } });
  albums.clear('a');
  assert.deepEqual((await f.inject('/api/s/a/album')).json(), { photos: [] });
});
