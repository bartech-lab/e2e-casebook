import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

export type Transfers = ReturnType<typeof createTransfers>;

export function createTransfers() {
  const sent = new Map<string, { account: string }[]>();
  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/transfers', async (req) => ({ transfers: sent.get(req.params.sandbox) ?? [] }));
      scope.post<{ Params: Params; Body: { account?: unknown } }>('/transfers', async (req, reply) => {
        const account = req.body?.account;
        if (typeof account !== 'string' || !account) return reply.code(400).send({ error: 'account is required' });
        const list = sent.get(req.params.sandbox) ?? [];
        list.push({ account });
        sent.set(req.params.sandbox, list);
        return { ok: true };
      });
    },
    clear(sandbox: string) {
      sent.delete(sandbox);
    },
  };
}
