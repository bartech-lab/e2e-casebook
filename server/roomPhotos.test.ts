import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { crc32, inflateSync } from 'node:zlib';
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

test('a room photo is a valid RGB PNG of its colour, cached publicly, and each width is its own file', async () => {
  const f = Fastify();
  registerRoomPhotos(f);
  await f.inject({ url: '/api/room-photos/garden-400.png' });
  const res = await f.inject({ url: '/api/room-photos/garden-800.png' });
  assert.equal(res.headers['cache-control'], 'public, max-age=3600');
  const png = res.rawPayload;
  assert.equal(png.readUInt32BE(16), 800);
  const chunks: { type: string; data: Buffer }[] = [];
  for (let at = 8; at < png.length; ) {
    const len = png.readUInt32BE(at);
    const type = png.subarray(at + 4, at + 8).toString('ascii');
    const data = png.subarray(at + 8, at + 8 + len);
    assert.equal(png.readUInt32BE(at + 8 + len), crc32(png.subarray(at + 4, at + 8 + len)) >>> 0, `${type} CRC`);
    chunks.push({ type, data });
    at += 12 + len;
  }
  assert.deepEqual(chunks.map((c) => c.type), ['IHDR', 'IDAT', 'IEND']);
  assert.deepEqual([...chunks[0]!.data.subarray(8)], [8, 2, 0, 0, 0]);
  const raw = inflateSync(chunks[1]!.data);
  assert.equal(raw.length, 600 * (1 + 800 * 3));
  assert.deepEqual([...raw.subarray(0, 7)], [0, 120, 170, 110, 120, 170, 110]);
  assert.equal((await f.inject({ url: '/api/room-photos/garden-400.png' })).rawPayload.readUInt32BE(16), 400);
});
