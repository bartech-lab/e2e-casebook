import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

export const ARTICLES = [
  { id: 1, title: 'A new tram line for Mokotów', paragraphs: 3 },
  { id: 2, title: 'The library opens on Sundays', paragraphs: 3 },
  { id: 3, title: 'Roadworks on Puławska until March', paragraphs: 3 },
  { id: 4, title: 'Winter market dates', paragraphs: 3 },
  { id: 5, title: 'The full council budget, line by line', paragraphs: 60 },
  { id: 6, title: 'Free flu jabs at the clinic', paragraphs: 3 },
  { id: 7, title: 'Lost and found: a grey cat', paragraphs: 3 },
  { id: 8, title: 'Next month in the community hall', paragraphs: 3 },
];

export type Articles = ReturnType<typeof createArticles>;

export function createArticles() {
  const reads = new Map<string, Set<number>>();
  const of = (sandbox: string) => {
    if (!reads.has(sandbox)) reads.set(sandbox, new Set());
    return reads.get(sandbox)!;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/articles', async (req) => ({
        articles: ARTICLES.map((a) => ({ ...a, read: of(req.params.sandbox).has(a.id) })),
      }));
      scope.post<{ Params: Params & { id: string } }>('/articles/:id/read', async (req, reply) => {
        const id = Number(req.params.id);
        if (!ARTICLES.some((a) => a.id === id)) return reply.code(404).send({ error: 'No such article' });
        of(req.params.sandbox).add(id);
        return { id, read: true };
      });
    },
    clear(sandbox: string) {
      reads.delete(sandbox);
    },
  };
}
