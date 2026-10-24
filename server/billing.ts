import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

export type Billing = ReturnType<typeof createBilling>;

const KEYS = new Set(['buyer', 'name', 'email', 'companyName', 'vatNumber', 'invoiceEmail']);

export function createBilling() {
  const saved = new Map<string, Record<string, string>>();
  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/billing', async (req) => ({ billing: saved.get(req.params.sandbox) ?? null }));
      scope.put<{ Params: Params }>('/billing', async (req, reply) => {
        const body = req.body as Record<string, unknown> | undefined;
        if (!body || typeof body !== 'object') return reply.code(400).send({ error: 'expected an object' });
        const entries = Object.entries(body);
        if (!entries.every(([k, v]) => KEYS.has(k) && typeof v === 'string')) return reply.code(400).send({ error: 'unknown field or not a string' });
        if (body.buyer !== 'person' && body.buyer !== 'company') return reply.code(400).send({ error: 'buyer must be person or company' });
        saved.set(req.params.sandbox, Object.fromEntries(entries) as Record<string, string>);
        return { ok: true };
      });
    },
    clear(sandbox: string) {
      saved.delete(sandbox);
    },
  };
}
