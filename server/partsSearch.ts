import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Limit = { allowed: number; retryAfter: number; form: 'seconds' | 'date'; until: number };

const PARTS = [
  'Brake cable', 'Brake pads', 'Brake lever', 'Chain', 'Chain ring', 'Chain tool', 'Crank arm', 'Derailleur hanger',
  'Front light', 'Handlebar tape', 'Inner tube', 'Pedals', 'Rear light', 'Saddle', 'Seat post', 'Spokes', 'Tyre lever', 'Valve cap',
];

export type PartsSearch = ReturnType<typeof createPartsSearch>;

export function createPartsSearch() {
  const limits = new Map<string, Limit>();
  const logs = new Map<string, string[]>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params; Querystring: { q?: string } }>('/parts', async (req, reply) => {
        const { sandbox } = req.params;
        const q = (req.query.q ?? '').trim();
        logs.set(sandbox, [...(logs.get(sandbox) ?? []), q]);
        const limit = limits.get(sandbox);
        if (limit) {
          if (limit.until && Date.now() >= limit.until) limits.delete(sandbox);
          else if (limit.until || limit.allowed === 0) {
            limit.until ||= Math.ceil(Date.now() / 1000 + limit.retryAfter) * 1000;
            const header = limit.form === 'date' ? new Date(limit.until).toUTCString() : String(Math.ceil((limit.until - Date.now()) / 1000));
            return reply.code(429).header('retry-after', header).send({ error: 'too many searches' });
          } else limit.allowed--;
        }
        const needle = q.toLowerCase();
        return { parts: needle ? PARTS.filter((p) => p.toLowerCase().includes(needle)) : [] };
      });
    },
    limit(sandbox: string, allowed: number, retryAfter: number, form: 'seconds' | 'date') {
      limits.set(sandbox, { allowed, retryAfter, form, until: 0 });
    },
    log(sandbox: string) {
      return logs.get(sandbox) ?? [];
    },
    clear(sandbox: string) {
      limits.delete(sandbox);
      logs.delete(sandbox);
    },
  };
}
