import type { FastifyInstance, FastifyRequest } from 'fastify';
import { createHmac, randomBytes } from 'node:crypto';

type Params = { sandbox: string };
type Order = { id: number; status: 'unpaid' | 'paid' | 'declined'; payments: number };
const SECRET = randomBytes(16);
const sign = (sandbox: string, order: number, status: string) => createHmac('sha256', SECRET).update(`${sandbox}|${order}|${status}`).digest('hex');
const portOf = (req: FastifyRequest) => (req.headers.host ?? '').split(':')[1] ?? '80';

export type PayByBank = ReturnType<typeof createPayByBank>;

export function createPayByBank(hasSandbox: (id: string) => boolean) {
  const orders = new Map<string, Map<number, Order & { session: string }>>();
  const cookieName = (sandbox: string) => `pbb_${sandbox}`;
  const of = (sandbox: string) => orders.get(sandbox) ?? orders.set(sandbox, new Map()).get(sandbox)!;

  function session(req: FastifyRequest<{ Params: Params }>) {
    const m = new RegExp(`(?:^|;\\s*)${cookieName(req.params.sandbox)}=([a-f0-9]+)`).exec(req.headers.cookie ?? '');
    return m?.[1] ?? null;
  }
  const mine = (sandbox: string, s: string | null) => [...of(sandbox).values()].filter((o) => s && o.session === s).map(({ session: _, ...o }) => o);

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/pbb/orders', async (req) => ({ orders: mine(req.params.sandbox, session(req)) }));

      scope.post<{ Params: Params }>('/pbb/orders', async (req, reply) => {
        const s = session(req) ?? randomBytes(12).toString('hex');
        const all = of(req.params.sandbox);
        const order = { id: all.size + 1, status: 'unpaid' as const, payments: 0, session: s };
        all.set(order.id, order);
        const bank = `http://127.0.0.1:${portOf(req)}/embed/bank/${req.params.sandbox}/${order.id}`;
        return reply
          .header('set-cookie', `${cookieName(req.params.sandbox)}=${s}; Path=/; HttpOnly; SameSite=Lax`)
          .code(201)
          .send({ id: order.id, bank });
      });

      scope.post<{ Params: Params; Body: { order?: string; status?: string; sig?: string } }>('/pbb/return', async (req, reply) => {
        const id = Number(req.body?.order);
        const status = req.body?.status ?? '';
        const order = of(req.params.sandbox).get(id);
        if (!order || !['paid', 'declined'].includes(status) || req.body?.sig !== sign(req.params.sandbox, id, status)) {
          return reply.code(400).send({ error: 'This payment return is not valid.' });
        }
        if (order.status !== 'paid') {
          order.status = status as Order['status'];
          if (status === 'paid') order.payments += 1;
        }
        return reply.redirect(`http://localhost:${portOf(req)}/s/${req.params.sandbox}/pay-by-bank?order=${id}`, 303);
      });
    },
    serve(root: FastifyInstance) {
      root.get<{ Params: Params & { order: string } }>('/embed/bank/:sandbox/:order', async (req, reply) => {
        const { sandbox } = req.params;
        const id = Number(req.params.order);
        if (!hasSandbox(sandbox) || !of(sandbox).has(id)) return reply.code(404).send({ error: 'no such payment' });
        const back = `http://localhost:${portOf(req)}/api/s/${sandbox}/pbb/return`;
        const form = (status: string, label: string) =>
          `<form method="post" action="${back}"><input type="hidden" name="order" value="${id}" /><input type="hidden" name="status" value="${status}" /><input type="hidden" name="sig" value="${sign(sandbox, id, status)}" /><button type="submit">${label}</button></form>`;
        return reply.type('text/html').send(`<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Mock Bank</title>
  <style>body { font-family: system-ui, sans-serif; margin: 2rem; } form { display: inline-block; margin-right: 1rem; }</style></head>
  <body>
    <h1>Mock Bank</h1>
    <p>Approve a payment of 120.00 PLN to Rowing Club Shop, order ${id}?</p>
    ${form('paid', 'Approve')}
    ${form('declined', 'Decline')}
  </body>
</html>
`);
      });
    },
    clear(sandbox: string) {
      orders.delete(sandbox);
    },
  };
}
