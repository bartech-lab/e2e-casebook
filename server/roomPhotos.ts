import type { FastifyInstance } from 'fastify';
import { crc32, deflateSync } from 'node:zlib';

const COLOURS: Record<string, [number, number, number]> = {
  garden: [120, 170, 110],
  attic: [190, 150, 110],
  harbour: [100, 140, 190],
  wave: [220, 220, 235],
};
const WIDTHS = new Set([400, 800, 1600]);

function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

export function png(width: number, height: number, [r, g, b]: [number, number, number]) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x++) row.set([r, g, b], 1 + x * 3);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const cache = new Map<string, Buffer>();

export function registerRoomPhotos(app: FastifyInstance) {
  app.get<{ Params: { name: string; width: string } }>('/api/room-photos/:name-:width.png', async (req, reply) => {
    const colour = COLOURS[req.params.name];
    const width = Number(req.params.width);
    if (!colour || !WIDTHS.has(width)) return reply.code(404).send({ error: 'No such photo.' });
    const key = `${req.params.name}-${width}`;
    const height = req.params.name === 'wave' ? width / 8 : (width * 3) / 4;
    const body = cache.get(key) ?? cache.set(key, png(width, height, colour)).get(key)!;
    return reply.header('content-type', 'image/png').header('cache-control', 'public, max-age=3600').send(body);
  });
}
