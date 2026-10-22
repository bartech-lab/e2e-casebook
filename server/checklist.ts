import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Item = { clientId: string; text: string };

export type Checklist = ReturnType<typeof createChecklist>;

export function createChecklist() {
  const lists = new Map<string, Item[]>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/checklist', async (req) => ({ items: lists.get(req.params.sandbox) ?? [] }));

      scope.post<{ Params: Params }>('/checklist', async (req, reply) => {
        const { clientId, text } = (req.body ?? {}) as { clientId?: unknown; text?: unknown };
        if (typeof clientId !== 'string' || !/^[\w-]{8,64}$/.test(clientId) || typeof text !== 'string' || !text.trim() || text.length > 100) {
          return reply.code(400).send({ error: 'clientId and text of 1 to 100 characters' });
        }
        const list = lists.get(req.params.sandbox) ?? [];
        const existing = list.find((i) => i.clientId === clientId);
        if (existing) return existing;
        const item = { clientId, text: text.trim() };
        list.push(item);
        lists.set(req.params.sandbox, list);
        return reply.code(201).send(item);
      });
    },
    clear(sandbox: string) {
      lists.delete(sandbox);
    },
  };
}
