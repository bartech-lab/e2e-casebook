import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { registerRoomPhotos } from './roomPhotos.ts';

test('room photos are PNGs of the asked width at 4:3, and unknown ones are 404', async () => {
  const f = Fastify();
  registerRoomPhotos(f);
  const res = await f.inject({ url: '/api/room-photos/garden-800.png' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['content-type'], 'image/png');
  assert.equal(res.rawPayload.readUInt32BE(16), 800);
  assert.equal(res.rawPayload.readUInt32BE(20), 600);
  assert.equal((await f.inject({ url: '/api/room-photos/wave-400.png' })).rawPayload.readUInt32BE(20), 50);
  assert.equal((await f.inject({ url: '/api/room-photos/garden-500.png' })).statusCode, 404);
  assert.equal((await f.inject({ url: '/api/room-photos/cellar-400.png' })).statusCode, 404);
});
