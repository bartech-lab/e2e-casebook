import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
const TOTAL = 95;
const PAGE = 20;
const WORDS = ['parcel', 'invoice', 'refund', 'tracking', 'address', 'courier', 'weekend', 'thanks'];

export const historyMessage = (n: number) => ({
  id: n,
  from: n % 2 ? 'Ola' : 'You',
  text: `Message ${n}: ${Array.from({ length: 3 + ((n * 7) % 23) }, (_, i) => WORDS[(n + i) % WORDS.length]).join(' ')}`,
});

export type ChatHistory = ReturnType<typeof createChatHistory>;

export function createChatHistory() {
  const failures = new Map<string, number>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params; Querystring: { before?: string } }>('/chat-history', async (req, reply) => {
        const left = failures.get(req.params.sandbox) ?? 0;
        if (left > 0) {
          failures.set(req.params.sandbox, left - 1);
          return reply.code(503).send({ error: 'try again' });
        }
        const before = req.query.before === undefined ? TOTAL + 1 : Number(req.query.before);
        if (!Number.isInteger(before) || before < 1) return reply.code(400).send({ error: 'before must be a message id' });
        const from = Math.max(1, before - PAGE);
        const messages = Array.from({ length: before - from }, (_, i) => historyMessage(from + i));
        return { messages, more: from > 1 };
      });
    },
    fail(sandbox: string, times: number) {
      failures.set(sandbox, times);
    },
    clear(sandbox: string) {
      failures.delete(sandbox);
    },
  };
}
