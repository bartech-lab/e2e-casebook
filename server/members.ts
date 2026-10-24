import type { FastifyInstance, FastifyRequest } from 'fastify';
import { randomBytes } from 'node:crypto';

type Params = { sandbox: string };
const PASSWORD = 'rowing';

export type Members = ReturnType<typeof createMembers>;

export function createMembers() {
  const sessions = new Map<string, string>();
  const cookieName = (sandbox: string) => `members_${sandbox}`;

  function signedIn(req: FastifyRequest<{ Params: Params }>) {
    for (const part of (req.headers.cookie ?? '').split(';')) {
      const [k, v] = part.trim().split('=');
      if (k === cookieName(req.params.sandbox) && sessions.get(v ?? '') === req.params.sandbox) return v!;
    }
    return null;
  }

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/members/me', async (req) => ({ signedIn: signedIn(req) !== null }));
      scope.post<{ Params: Params; Body: { password?: string } }>('/members/sign-in', async (req, reply) => {
        if (req.body?.password !== PASSWORD) return reply.code(401).send({ error: 'Wrong password.' });
        const token = randomBytes(12).toString('hex');
        sessions.set(token, req.params.sandbox);
        return reply.header('set-cookie', `${cookieName(req.params.sandbox)}=${token}; Path=/; HttpOnly; SameSite=Lax`).send({ ok: true });
      });
      scope.post<{ Params: Params }>('/members/sign-out', async (req, reply) => {
        const token = signedIn(req);
        if (token) sessions.delete(token);
        return reply.header('set-cookie', `${cookieName(req.params.sandbox)}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`).send({ ok: true });
      });
    },
    clear(sandbox: string) {
      for (const [token, s] of sessions) if (s === sandbox) sessions.delete(token);
    },
  };
}
