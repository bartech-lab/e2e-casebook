import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

export type Printer = ReturnType<typeof createPrinter>;

export function createPrinter() {
  const down = new Set<string>();
  const checks = new Map<string, number>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/printer', async (req, reply) => {
        checks.set(req.params.sandbox, (checks.get(req.params.sandbox) ?? 0) + 1);
        if (down.has(req.params.sandbox)) return reply.code(503).send({ error: 'printer offline' });
        return { status: 'ready', queue: 2 };
      });
    },
    setDown(sandbox: string, isDown: boolean) {
      if (isDown) down.add(sandbox);
      else down.delete(sandbox);
    },
    checks(sandbox: string) {
      return checks.get(sandbox) ?? 0;
    },
    clear(sandbox: string) {
      down.delete(sandbox);
      checks.delete(sandbox);
    },
  };
}
