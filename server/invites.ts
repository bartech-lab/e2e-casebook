import type { FastifyInstance } from 'fastify';
import { randomBytes } from 'node:crypto';

type Params = { sandbox: string };

export type Invites = ReturnType<typeof createInvites>;

export function createInvites() {
  const tokens = new Map<string, string>();
  const fresh = () => randomBytes(9).toString('base64url');

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/invite', async (req) => {
        const token = tokens.get(req.params.sandbox) ?? fresh();
        tokens.set(req.params.sandbox, token);
        return { path: `/invite/${token}` };
      });

      scope.post<{ Params: Params }>('/invite', async (req) => {
        const token = fresh();
        tokens.set(req.params.sandbox, token);
        return { path: `/invite/${token}` };
      });
    },
    clear(sandbox: string) {
      tokens.delete(sandbox);
    },
  };
}
