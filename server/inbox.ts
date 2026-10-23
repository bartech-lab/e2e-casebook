import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Message = { id: number; from: string; subject: string; unread: boolean };

const DEFAULTS: Message[] = [
  { id: 1, from: 'Ann', subject: 'Lunch on Friday?', unread: true },
  { id: 2, from: 'Bank', subject: 'Your statement is ready', unread: false },
  { id: 3, from: 'Piotr', subject: 'Photos from the trip', unread: true },
  { id: 4, from: 'Shop', subject: 'Your order has shipped', unread: false },
  { id: 5, from: 'Ann', subject: 'Re: Lunch on Friday?', unread: true },
  { id: 6, from: 'Newsletter', subject: 'Ten tips for spring', unread: false },
  { id: 7, from: 'Landlord', subject: 'Rent for November', unread: true },
  { id: 8, from: 'Gym', subject: 'Your membership renews soon', unread: false },
];

export type Inbox = ReturnType<typeof createInbox>;

export function createInbox() {
  const boxes = new Map<string, Message[]>();
  const box = (sandbox: string) => boxes.get(sandbox) ?? DEFAULTS;

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/inbox', async (req) => ({ messages: box(req.params.sandbox) }));

      scope.post<{ Params: Params }>('/inbox/archive', async (req, reply) => {
        const { ids } = (req.body ?? {}) as { ids?: unknown };
        if (!Array.isArray(ids) || !ids.length || !ids.every((id) => Number.isInteger(id))) return reply.code(400).send({ error: 'ids must be a non-empty list of integers' });
        const remove = new Set(ids as number[]);
        const kept = box(req.params.sandbox).filter((m) => !remove.has(m.id));
        boxes.set(req.params.sandbox, kept);
        return { messages: kept };
      });
    },
    clear(sandbox: string) {
      boxes.delete(sandbox);
    },
  };
}
