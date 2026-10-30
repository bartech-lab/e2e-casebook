import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Faults = { badStock: number; reorderFails: number };
const STOCK = [
  { name: 'Coffee beans', left: '2 kg' },
  { name: 'Oat milk', left: '6 cartons' },
  { name: 'Croissants', left: '14' },
];

export type Cafe = ReturnType<typeof createCafe>;

export function createCafe() {
  const faults = new Map<string, Faults>();
  const reorders = new Map<string, string[]>();
  const of = (sandbox: string) => faults.get(sandbox) ?? { badStock: 0, reorderFails: 0 };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/cafe/orders', async () => ({ count: 37 }));
      scope.get<{ Params: Params }>('/cafe/reviews', async () => ({ average: 4.6, count: 128 }));
      scope.get<{ Params: Params }>('/cafe/stock', async (req) => {
        const f = of(req.params.sandbox);
        if (f.badStock > 0) {
          faults.set(req.params.sandbox, { ...f, badStock: f.badStock - 1 });
          return { items: null };
        }
        return { items: STOCK };
      });
      scope.post<{ Params: Params; Body: { name?: string } }>('/cafe/reorders', async (req, reply) => {
        const f = of(req.params.sandbox);
        if (f.reorderFails > 0) {
          faults.set(req.params.sandbox, { ...f, reorderFails: f.reorderFails - 1 });
          return reply.code(500).send({ error: 'supplier down' });
        }
        if (!STOCK.some((s) => s.name === req.body?.name)) return reply.code(400).send({ error: 'unknown item' });
        reorders.set(req.params.sandbox, [...(reorders.get(req.params.sandbox) ?? []), req.body!.name!]);
        return reply.code(201).send({ ok: true });
      });
      scope.get<{ Params: Params }>('/cafe/reorders', async (req) => ({ reorders: reorders.get(req.params.sandbox) ?? [] }));
    },
    fail(sandbox: string, next: Partial<Faults>) {
      faults.set(sandbox, { ...of(sandbox), ...next });
    },
    clear(sandbox: string) {
      faults.delete(sandbox);
      reorders.delete(sandbox);
    },
  };
}
