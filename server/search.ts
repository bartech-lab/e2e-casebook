import type { FastifyInstance } from 'fastify';

export const PRODUCTS = [
  'Desk lamp',
  'Lava lamp',
  'Lamp shade',
  'Ladder',
  'Laptop stand',
  'Lavender soap',
  'Tea & Coffee set',
  'Green tea',
  'Coffee grinder',
  'Teapot',
  'Table',
  'Chair',
];

export function search(q: string) {
  const needle = q.trim().toLowerCase();
  return needle ? PRODUCTS.filter((p) => p.toLowerCase().includes(needle)) : [...PRODUCTS];
}

export function registerSearch(scope: FastifyInstance) {
  scope.get<{ Querystring: { q?: string } }>('/search', async (req) => {
    const q = req.query.q ?? '';
    return { q, results: search(q) };
  });
}
