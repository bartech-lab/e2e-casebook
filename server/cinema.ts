import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

export type Cinema = ReturnType<typeof createCinema>;

export function createCinema() {
  const taken = new Map<string, string[]>();
  const of = (sandbox: string) => taken.get(sandbox) ?? [];

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/cinema/seats', async (req) => ({ taken: of(req.params.sandbox) }));
      scope.post<{ Params: Params; Body: { seat?: string } }>('/cinema/seats', async (req, reply) => {
        const seat = req.body?.seat ?? '';
        if (!/^A[1-6]$/.test(seat)) return reply.code(400).send({ error: 'seat must be A1 to A6' });
        if (of(req.params.sandbox).includes(seat)) return reply.code(409).send({ error: `Seat ${seat} is already taken.` });
        taken.set(req.params.sandbox, [...of(req.params.sandbox), seat]);
        return reply.code(201).send({ seat });
      });
    },
    clear(sandbox: string) {
      taken.delete(sandbox);
    },
  };
}
