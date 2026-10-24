import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Photo = { path: string; size: number };
const MAX_PHOTOS = 200;

export type Albums = ReturnType<typeof createAlbums>;

export function createAlbums() {
  const albums = new Map<string, Photo[]>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/album', async (req) => ({ photos: albums.get(req.params.sandbox) ?? [] }));
      scope.post<{ Params: Params; Body: { photos?: unknown } }>('/album', async (req, reply) => {
        const photos = req.body?.photos;
        const valid =
          Array.isArray(photos) &&
          photos.length > 0 &&
          photos.length <= MAX_PHOTOS &&
          photos.every((p) => typeof p?.path === 'string' && p.path.length > 0 && Number.isInteger(p?.size) && p.size >= 0);
        if (!valid) return reply.code(400).send({ error: `Send 1 to ${MAX_PHOTOS} photos, each with a path and a size.` });
        const list = (photos as Photo[]).map(({ path, size }) => ({ path, size }));
        albums.set(req.params.sandbox, list);
        return { photos: list };
      });
    },
    clear(sandbox: string) {
      albums.delete(sandbox);
    },
  };
}
