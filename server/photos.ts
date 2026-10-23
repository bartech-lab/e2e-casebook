import type { FastifyInstance } from 'fastify';

const COLORS = ['#e76f51', '#2a9d8f', '#e9c46a', '#264653', '#f4a261', '#8ab17d'];

export function registerPhotos(scope: FastifyInstance) {
  scope.get<{ Params: { n: string } }>('/photos/:n.svg', async (req, reply) => {
    const n = Number(req.params.n);
    if (!Number.isInteger(n) || n < 1 || n > 24) return reply.code(404).send({ error: 'no such photo' });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="240" height="160" fill="${COLORS[n % COLORS.length]}"/><text x="120" y="92" font-size="40" text-anchor="middle" fill="#fff">${n}</text></svg>`;
    return reply.type('image/svg+xml').header('cache-control', 'no-store').send(svg);
  });
}
