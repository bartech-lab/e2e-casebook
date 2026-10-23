import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Entry = { rating: number; comment: string };

export type FeedbackStore = ReturnType<typeof createFeedback>;

export function createFeedback() {
  const entries = new Map<string, Entry[]>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/feedback', async (req) => ({ entries: entries.get(req.params.sandbox) ?? [] }));

      scope.post<{ Params: Params }>('/feedback', async (req, reply) => {
        const { rating, comment = '' } = (req.body ?? {}) as { rating?: unknown; comment?: unknown };
        if (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5 || typeof comment !== 'string' || comment.length > 500) {
          return reply.code(400).send({ error: 'rating 1 to 5 and a comment of at most 500 characters' });
        }
        const entry = { rating: rating as number, comment };
        entries.set(req.params.sandbox, [...(entries.get(req.params.sandbox) ?? []), entry]);
        return reply.code(201).send(entry);
      });
    },
    clear(sandbox: string) {
      entries.delete(sandbox);
    },
  };
}
