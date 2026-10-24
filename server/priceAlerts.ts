import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Alert = { price: number; on: boolean };

export type PriceAlerts = ReturnType<typeof createPriceAlerts>;

export function createPriceAlerts() {
  const alerts = new Map<string, Alert>();
  const of = (sandbox: string) => {
    if (!alerts.has(sandbox)) alerts.set(sandbox, { price: 34900, on: false });
    return alerts.get(sandbox)!;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/price-alert', async (req) => ({ ...of(req.params.sandbox) }));
      scope.put<{ Params: Params }>('/price-alert', async (req, reply) => {
        const on = (req.body as { on?: unknown } | undefined)?.on;
        if (typeof on !== 'boolean') return reply.code(400).send({ error: 'on must be true or false' });
        of(req.params.sandbox).on = on;
        return { ...of(req.params.sandbox) };
      });
    },
    setPrice(sandbox: string, price: number) {
      of(sandbox).price = price;
      return { ...of(sandbox) };
    },
    clear(sandbox: string) {
      alerts.delete(sandbox);
    },
  };
}
