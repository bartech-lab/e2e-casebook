import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Invoice = { customer: string; lines: { item: string; quantity: number }[]; notes: string };

export type QuickInvoice = ReturnType<typeof createQuickInvoice>;

export function createQuickInvoice() {
  const saved = new Map<string, Invoice[]>();

  return {
    register(scope: FastifyInstance) {
      scope.post<{ Params: Params; Body: Partial<Invoice> }>('/quick-invoices', async (req, reply) => {
        const { customer, lines, notes } = req.body ?? {};
        const ok =
          typeof customer === 'string' &&
          typeof notes === 'string' &&
          Array.isArray(lines) &&
          lines.every((l) => typeof l?.item === 'string' && Number.isInteger(l?.quantity) && l.quantity > 0);
        if (!ok) return reply.code(400).send({ error: 'body must be { customer, lines: [{ item, quantity }], notes }' });
        saved.set(req.params.sandbox, [...(saved.get(req.params.sandbox) ?? []), { customer: customer!, lines: lines!, notes: notes! }]);
        return reply.code(201).send({ number: saved.get(req.params.sandbox)!.length });
      });
      scope.get<{ Params: Params }>('/quick-invoices', async (req) => ({ invoices: saved.get(req.params.sandbox) ?? [] }));
    },
    clear(sandbox: string) {
      saved.delete(sandbox);
    },
  };
}
