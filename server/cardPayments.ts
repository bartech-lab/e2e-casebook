import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Payment = { id: string; amount: number; last4: string };
const DECLINED = '4000000000000002';

export type CardPayments = ReturnType<typeof createCardPayments>;

export function createCardPayments() {
  const sandboxes = new Map<string, Payment[]>();
  const of = (sandbox: string) => {
    if (!sandboxes.has(sandbox)) sandboxes.set(sandbox, []);
    return sandboxes.get(sandbox)!;
  };
  return {
    register(scope: FastifyInstance) {
      scope.post<{ Params: Params; Body: { number?: unknown; expiry?: unknown; cvc?: unknown; amount?: unknown } }>('/pay/charge', async (req, reply) => {
        const { number, expiry, cvc, amount } = req.body ?? {};
        if (typeof number !== 'string' || !/^\d{16}$/.test(number) || typeof expiry !== 'string' || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry) || typeof cvc !== 'string' || !/^\d{3}$/.test(cvc) || typeof amount !== 'number' || !(amount > 0))
          return reply.code(400).send({ error: 'Check the card details.' });
        if (number === DECLINED) return reply.code(402).send({ error: 'Your card was declined.' });
        const list = of(req.params.sandbox);
        const payment = { id: `PAY-${list.length + 1}`, amount, last4: number.slice(-4) };
        list.push(payment);
        return reply.code(201).send(payment);
      });
      scope.get<{ Params: Params }>('/pay/payments', async (req) => ({ payments: of(req.params.sandbox) }));
    },
    clear(sandbox: string) {
      sandboxes.delete(sandbox);
    },
  };
}
