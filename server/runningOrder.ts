import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

export const ACTS = [
  'Brass band', 'Juggler', 'Choir', 'Magician', 'Folk duo', 'Poetry', 'Tap dancers', 'Accordion', 'Comedian', 'String quartet',
  'Puppet show', 'Rock school', 'Ventriloquist', 'Harpist', 'Acrobats', 'Ukulele club', 'Beatboxer', 'Opera singer', 'Clowns', 'Steel drums',
  'Mime', 'Jazz trio', 'Fire eater', 'Bagpipes', 'Ballet school', 'Storyteller', 'DJ', 'Gospel choir', 'Unicyclist', 'Finale',
];

export type RunningOrder = ReturnType<typeof createRunningOrder>;

export function createRunningOrder() {
  const orders = new Map<string, string[]>();
  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/running-order', async (req) => ({ acts: orders.get(req.params.sandbox) ?? ACTS }));
      scope.put<{ Params: Params; Body: { acts?: unknown } }>('/running-order', async (req, reply) => {
        const acts = req.body?.acts;
        if (!Array.isArray(acts) || acts.length !== ACTS.length || [...acts].sort().join('|') !== [...ACTS].sort().join('|')) {
          return reply.code(400).send({ error: 'acts must list every act once' });
        }
        orders.set(req.params.sandbox, acts as string[]);
        return { ok: true };
      });
    },
    clear(sandbox: string) {
      orders.delete(sandbox);
    },
  };
}
