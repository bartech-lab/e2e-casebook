import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Entry = { name: string; rating: number; comment: string };

export type EventFeedback = ReturnType<typeof createEventFeedback>;

export function createEventFeedback() {
  const entries = new Map<string, Entry[]>();
  const of = (sandbox: string) => {
    if (!entries.has(sandbox)) entries.set(sandbox, []);
    return entries.get(sandbox)!;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/event-feedback', async (req) => ({ entries: of(req.params.sandbox) }));
      scope.post<{ Params: Params; Body: Record<string, unknown> }>('/event-feedback', async (req, reply) => {
        const { name, rating, comment } = req.body ?? {};
        const r = typeof rating === 'string' ? Number(rating) : NaN;
        if (typeof name !== 'string' || !name.trim()) return reply.code(400).send({ error: 'Enter your name.' });
        if (!Number.isInteger(r) || r < 1 || r > 5) return reply.code(400).send({ error: 'Choose a rating from 1 to 5.' });
        const entry = { name: name.trim(), rating: r, comment: typeof comment === 'string' ? comment.trim() : '' };
        of(req.params.sandbox).push(entry);
        return entry;
      });
    },
    clear(sandbox: string) {
      entries.delete(sandbox);
    },
  };
}
