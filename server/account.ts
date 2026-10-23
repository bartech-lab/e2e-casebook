import type { FastifyInstance, FastifyRequest } from 'fastify';
import { randomBytes } from 'node:crypto';

type Params = { sandbox: string };

const EMAIL = 'ann@example.test';
const PASSWORD = 'correct horse';
const REMEMBER_S = 30 * 24 * 60 * 60;

const cookieName = (sandbox: string) => `account_${sandbox}`;

function readCookie(req: FastifyRequest, name: string) {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return undefined;
}

export type Accounts = ReturnType<typeof createAccounts>;

export function createAccounts() {
  const sessions = new Map<string, { sandbox: string; email: string }>();

  return {
    register(scope: FastifyInstance) {
      scope.post<{ Params: Params }>('/account/login', async (req, reply) => {
        const { email, password, remember } = (req.body ?? {}) as { email?: unknown; password?: unknown; remember?: unknown };
        if (email !== EMAIL || password !== PASSWORD) return reply.code(401).send({ error: 'Wrong email or password.' });
        const token = randomBytes(18).toString('base64url');
        sessions.set(token, { sandbox: req.params.sandbox, email: EMAIL });
        const age = remember === true ? `; Max-Age=${REMEMBER_S}` : '';
        return reply.header('set-cookie', `${cookieName(req.params.sandbox)}=${token}; Path=/; HttpOnly; SameSite=Lax${age}`).send({ email: EMAIL });
      });

      scope.get<{ Params: Params }>('/account/me', async (req, reply) => {
        const session = sessions.get(readCookie(req, cookieName(req.params.sandbox)) ?? '');
        if (!session || session.sandbox !== req.params.sandbox) return reply.code(401).send({ error: 'Not signed in.' });
        return { email: session.email };
      });

      scope.post<{ Params: Params }>('/account/logout', async (req, reply) => {
        sessions.delete(readCookie(req, cookieName(req.params.sandbox)) ?? '');
        return reply.header('set-cookie', `${cookieName(req.params.sandbox)}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`).send({ ok: true });
      });
    },
    clear(sandbox: string) {
      for (const [token, s] of sessions) if (s.sandbox === sandbox) sessions.delete(token);
    },
  };
}
