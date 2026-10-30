import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export type Avatars = ReturnType<typeof createAvatars>;

export function createAvatars() {
  const avatars = new Map<string, Buffer>();

  return {
    register(scope: FastifyInstance) {
      scope.addContentTypeParser('image/png', { parseAs: 'buffer', bodyLimit: 2 * 1024 * 1024 }, (_req, body, done) => done(null, body));
      scope.put<{ Params: Params; Body: Buffer }>('/avatar', async (req, reply) => {
        if (!Buffer.isBuffer(req.body) || !req.body.subarray(0, 8).equals(PNG)) return reply.code(400).send({ error: 'send a PNG' });
        const width = req.body.readUInt32BE(16);
        const height = req.body.readUInt32BE(20);
        if (width !== 256 || height !== 256) return reply.code(400).send({ error: 'the photo must be 256 x 256' });
        avatars.set(req.params.sandbox, req.body);
        return reply.code(204).send();
      });
      scope.get<{ Params: Params }>('/avatar', async (req, reply) => {
        const png = avatars.get(req.params.sandbox);
        if (!png) return reply.code(404).send({ error: 'no photo yet' });
        return reply.header('cache-control', 'no-store').type('image/png').send(png);
      });
    },
    clear(sandbox: string) {
      avatars.delete(sandbox);
    },
  };
}
