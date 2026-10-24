import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
const LIMIT = 200;

export type ClientErrors = ReturnType<typeof createClientErrors>;

export function createClientErrors() {
  const logs = new Map<string, string[]>();
  const of = (sandbox: string) => {
    if (!logs.has(sandbox)) logs.set(sandbox, []);
    return logs.get(sandbox)!;
  };
  return {
    register(scope: FastifyInstance) {
      scope.post<{ Params: Params; Body: { message?: unknown } }>('/client-errors', async (req, reply) => {
        const message = typeof req.body?.message === 'string' ? req.body.message.slice(0, 300) : '';
        if (!message) return reply.code(400).send({ error: 'message is required' });
        const list = of(req.params.sandbox);
        if (list.length < LIMIT) list.push(message);
        return reply.code(204).send();
      });
      scope.get<{ Params: Params }>('/client-errors', async (req) => ({ errors: of(req.params.sandbox) }));
    },
    clear(sandbox: string) {
      logs.delete(sandbox);
    },
  };
}
