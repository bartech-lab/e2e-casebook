import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

const ACCOUNT = { account: 'alice@cloudpix.test', photos: ['Beach.jpg', 'Harbour.jpg', 'Lighthouse.jpg'] };

export type CloudPix = ReturnType<typeof createCloudPix>;

export function createCloudPix() {
  const sandboxes = new Map<string, { next: number; codes: Map<string, boolean>; exchanges: number }>();
  const of = (id: string) => sandboxes.get(id) ?? sandboxes.set(id, { next: 1, codes: new Map(), exchanges: 0 }).get(id)!;
  return {
    register(scope: FastifyInstance) {
      scope.post<{ Params: Params }>('/cloudpix/codes', async (req) => {
        const s = of(req.params.sandbox);
        const code = `C-${s.next++}`;
        s.codes.set(code, false);
        return { code };
      });
      scope.post<{ Params: Params; Body: { code?: unknown } }>('/cloudpix/token', async (req, reply) => {
        const s = of(req.params.sandbox);
        const code = req.body?.code;
        if (typeof code !== 'string' || s.codes.get(code) !== false) return reply.code(400).send({ error: 'unknown or used code' });
        s.codes.set(code, true);
        s.exchanges++;
        return ACCOUNT;
      });
    },
    exchanges(sandbox: string) {
      return of(sandbox).exchanges;
    },
    clear(sandbox: string) {
      sandboxes.delete(sandbox);
    },
  };
}
