import { randomBytes } from 'node:crypto';
import type { FastifyInstance, FastifyRequest } from 'fastify';

type Params = { sandbox: string };
const EMAIL = 'ola@example.com';
const PASSWORD = 'pierogi-2026';

export type ReaderAuth = ReturnType<typeof createReaderAuth>;

export function createReaderAuth() {
  const tokens = new Map<string, Set<string>>();
  const of = (sandbox: string) => {
    if (!tokens.has(sandbox)) tokens.set(sandbox, new Set());
    return tokens.get(sandbox)!;
  };
  const bearer = (req: FastifyRequest) => /^Bearer (\S+)$/.exec(req.headers.authorization ?? '')?.[1] ?? null;

  return {
    register(scope: FastifyInstance) {
      scope.post<{ Params: Params; Body: { email?: unknown; password?: unknown } }>('/reader/login', async (req, reply) => {
        const { email, password } = req.body ?? {};
        if (email !== EMAIL || password !== PASSWORD) return reply.code(401).send({ error: 'Wrong email or password.' });
        const token = randomBytes(18).toString('base64url');
        of(req.params.sandbox).add(token);
        return { token, email: EMAIL };
      });
      scope.get<{ Params: Params }>('/reader/me', async (req, reply) => {
        const token = bearer(req);
        if (!token || !of(req.params.sandbox).has(token)) return reply.code(401).send({ error: 'Not signed in.' });
        return { email: EMAIL };
      });
      scope.post<{ Params: Params }>('/reader/logout', async (req) => {
        const token = bearer(req);
        if (token) of(req.params.sandbox).delete(token);
        return { ok: true };
      });
    },
    expireAll(sandbox: string) {
      const n = of(sandbox).size;
      of(sandbox).clear();
      return { expired: n };
    },
    clear(sandbox: string) {
      tokens.delete(sandbox);
    },
  };
}
