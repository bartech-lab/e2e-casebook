import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

export type KitchenTimer = ReturnType<typeof createKitchenTimer>;

export function createKitchenTimer() {
  const rings = new Map<string, number[]>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/timer-rings', async (req) => ({ rings: rings.get(req.params.sandbox) ?? [] }));
      scope.post<{ Params: Params; Body: { endsAt?: unknown } }>('/timer-rings', async (req, reply) => {
        const endsAt = req.body?.endsAt;
        if (typeof endsAt !== 'number') return reply.code(400).send({ error: 'endsAt must be a number' });
        rings.set(req.params.sandbox, [...(rings.get(req.params.sandbox) ?? []), endsAt]);
        return reply.code(201).send({ ok: true });
      });
    },
    clear(sandbox: string) {
      rings.delete(sandbox);
    },
  };
}
