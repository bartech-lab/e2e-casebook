import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Balances = Record<string, number>;

export type TravelWallet = ReturnType<typeof createTravelWallet>;

const seed = (): Balances => ({ PLN: 123_450, JPY: 12_346, BHD: 1_235 });

export function createTravelWallet() {
  const wallets = new Map<string, Balances>();
  const wallet = (sandbox: string) => {
    let w = wallets.get(sandbox);
    if (!w) wallets.set(sandbox, (w = seed()));
    return w;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/wallet', async (req) => ({ balances: wallet(req.params.sandbox) }));
      scope.post<{ Params: Params; Body: { currency?: unknown; minor?: unknown } }>('/wallet/add', async (req, reply) => {
        const w = wallet(req.params.sandbox);
        const { currency, minor } = req.body ?? {};
        if (typeof currency !== 'string' || !(currency in w)) return reply.code(400).send({ error: 'unknown currency' });
        if (typeof minor !== 'number' || !Number.isSafeInteger(minor) || minor <= 0) return reply.code(400).send({ error: 'minor must be a positive integer' });
        w[currency] = (w[currency] ?? 0) + minor;
        return { balances: w };
      });
    },
    clear(sandbox: string) {
      wallets.delete(sandbox);
    },
  };
}
