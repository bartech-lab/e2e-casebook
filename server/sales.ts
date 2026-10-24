import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
const DEFAULT_MS = 15 * 60_000;
const PRICE = 19900;

export type Sales = ReturnType<typeof createSales>;

export function createSales(now: () => number = Date.now) {
  const ends = new Map<string, number>();
  const endsAt = (sandbox: string) => {
    if (!ends.has(sandbox)) ends.set(sandbox, now() + DEFAULT_MS);
    return ends.get(sandbox)!;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/sale', async (req) => ({
        price: PRICE,
        endsAt: new Date(endsAt(req.params.sandbox)).toISOString(),
        now: new Date(now()).toISOString(),
      }));
      scope.post<{ Params: Params }>('/sale/buy', async (req, reply) => {
        if (now() >= endsAt(req.params.sandbox)) return reply.code(410).send({ error: 'The sale has ended.' });
        return { price: PRICE };
      });
    },
    endIn(sandbox: string, ms: number) {
      ends.set(sandbox, now() + ms);
      return { endsAt: new Date(ends.get(sandbox)!).toISOString() };
    },
    clear(sandbox: string) {
      ends.delete(sandbox);
    },
  };
}
