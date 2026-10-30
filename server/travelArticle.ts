import type { FastifyInstance } from 'fastify';
import { png } from './roomPhotos.ts';

type Params = { sandbox: string; n: string };
const SIZES: Record<string, [number, number, [number, number, number]]> = {
  '1': [800, 500, [70, 130, 180]],
  '2': [800, 600, [200, 170, 110]],
  '3': [800, 450, [90, 160, 110]],
};
const images = new Map<string, Buffer>();

export function registerTravelArticle(scope: FastifyInstance) {
  scope.get<{ Params: Params }>('/travel-photos/:n', async (req, reply) => {
    const size = SIZES[req.params.n];
    if (!size) return reply.code(404).send({ error: 'no such photo' });
    const body = images.get(req.params.n) ?? images.set(req.params.n, png(...size)).get(req.params.n)!;
    return reply.type('image/png').header('cache-control', 'no-store').send(body);
  });
  scope.get('/newsletter-offer', async () => ({ text: 'Get one short trip idea every Friday.' }));
}
