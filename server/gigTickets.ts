import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Order = { id: string; quantity: number };
const START = 6;
const MAX_PER_ORDER = 4;

export type GigTickets = ReturnType<typeof createGigTickets>;

export function createGigTickets() {
  const stock = new Map<string, number>();
  const orders = new Map<string, Order[]>();
  const left = (sandbox: string) => stock.get(sandbox) ?? START;
  const list = (sandbox: string) => {
    if (!orders.has(sandbox)) orders.set(sandbox, []);
    return orders.get(sandbox)!;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/gig', async (req, reply) => {
        reply.header('cache-control', 'no-cache');
        return { left: left(req.params.sandbox), orders: list(req.params.sandbox) };
      });
      scope.post<{ Params: Params; Body: { quantity?: unknown } }>('/gig/buy', async (req, reply) => {
        const { sandbox } = req.params;
        const quantity = req.body?.quantity;
        if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_PER_ORDER)
          return reply.code(400).send({ error: `Choose 1 to ${MAX_PER_ORDER} tickets.` });
        if (quantity > left(sandbox)) return reply.code(409).send({ error: 'Not enough tickets left.', left: left(sandbox) });
        stock.set(sandbox, left(sandbox) - quantity);
        const order = { id: `G-${list(sandbox).length + 1}`, quantity };
        list(sandbox).push(order);
        return { order, left: left(sandbox) };
      });
    },
    setLeft(sandbox: string, n: number) {
      stock.set(sandbox, n);
      return { left: n };
    },
    clear(sandbox: string) {
      stock.delete(sandbox);
      orders.delete(sandbox);
    },
  };
}
