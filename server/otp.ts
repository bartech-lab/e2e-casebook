import type { FastifyInstance } from 'fastify';
import { randomInt } from 'node:crypto';

type Params = { sandbox: string };
const MAX_TRIES = 3;

export type Otps = ReturnType<typeof createOtps>;

export function createOtps() {
  const codes = new Map<string, { code: string; tries: number }>();

  return {
    register(scope: FastifyInstance) {
      scope.post<{ Params: Params }>('/otp/send', async (req) => {
        codes.set(req.params.sandbox, { code: String(randomInt(0, 1_000_000)).padStart(6, '0'), tries: 0 });
        return { sentTo: 'ann@example.test' };
      });

      scope.post<{ Params: Params }>('/otp/verify', async (req, reply) => {
        const entry = codes.get(req.params.sandbox);
        const code = (req.body as { code?: unknown } | undefined)?.code;
        if (!entry) return reply.code(400).send({ error: 'Ask for a code first.' });
        if (entry.tries >= MAX_TRIES) return reply.code(429).send({ error: 'Too many tries. Ask for a new code.' });
        if (typeof code === 'string' && code === entry.code) {
          codes.delete(req.params.sandbox);
          return { ok: true };
        }
        entry.tries++;
        if (entry.tries >= MAX_TRIES) return reply.code(429).send({ error: 'Too many tries. Ask for a new code.' });
        return reply.code(400).send({ error: 'That code is not right.' });
      });
    },
    code(sandbox: string) {
      return codes.get(sandbox)?.code ?? null;
    },
    clear(sandbox: string) {
      codes.delete(sandbox);
    },
  };
}
