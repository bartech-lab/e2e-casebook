import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
const INITIAL = 'Blue-Kettle-42';
const MIN = 12;

export type Passwords = ReturnType<typeof createPasswords>;

export function createPasswords() {
  const current = new Map<string, string>();
  const of = (sandbox: string) => current.get(sandbox) ?? INITIAL;

  return {
    register(scope: FastifyInstance) {
      scope.post<{ Params: Params }>('/password', async (req, reply) => {
        const body = (req.body ?? {}) as { current?: unknown; next?: unknown };
        if (typeof body.current !== 'string' || typeof body.next !== 'string') {
          return reply.code(400).send({ error: 'current and next must be strings' });
        }
        if (body.current !== of(req.params.sandbox)) return reply.code(403).send({ error: 'The current password is wrong.' });
        if ([...body.next].length < MIN) return reply.code(400).send({ error: `The new password needs at least ${MIN} characters.` });
        if (body.next === body.current) return reply.code(400).send({ error: 'The new password must be different from the current one.' });
        current.set(req.params.sandbox, body.next);
        return { ok: true };
      });
    },
    clear(sandbox: string) {
      current.delete(sandbox);
    },
  };
}
