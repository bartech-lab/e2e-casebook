import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

const WINDOW_MS = 30_000;

export type Sms = ReturnType<typeof createSms>;

export function createSms() {
  const last = new Map<string, number>();
  const offset = new Map<string, number>();
  const now = (sandbox: string) => Date.now() + (offset.get(sandbox) ?? 0);
  const remaining = (sandbox: string) => {
    const at = last.get(sandbox);
    return at === undefined ? 0 : Math.max(0, Math.ceil((at + WINDOW_MS - now(sandbox)) / 1000));
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/sms', async (req) => ({ retryAfter: remaining(req.params.sandbox) }));

      scope.post<{ Params: Params }>('/sms', async (req, reply) => {
        const wait = remaining(req.params.sandbox);
        if (wait > 0) return reply.code(429).header('retry-after', String(wait)).send({ error: 'Too many codes. Wait before asking again.' });
        last.set(req.params.sandbox, now(req.params.sandbox));
        return { sent: true, retryAfter: WINDOW_MS / 1000 };
      });
    },
    advance(sandbox: string, ms: number) {
      offset.set(sandbox, (offset.get(sandbox) ?? 0) + ms);
    },
    clear(sandbox: string) {
      last.delete(sandbox);
      offset.delete(sandbox);
    },
  };
}
