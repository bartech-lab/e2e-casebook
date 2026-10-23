import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Signature = { kind: 'drawn'; png: string } | { kind: 'typed'; name: string };

export type Deliveries = ReturnType<typeof createDeliveries>;

export function createDeliveries() {
  const signatures = new Map<string, Signature>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/delivery/signature', async (req, reply) => {
        const s = signatures.get(req.params.sandbox);
        return s ?? reply.code(404).send({ error: 'Not signed yet.' });
      });

      scope.post<{ Params: Params }>('/delivery/sign', async (req, reply) => {
        const body = (req.body ?? {}) as { kind?: unknown; png?: unknown; name?: unknown };
        if (body.kind === 'drawn' && typeof body.png === 'string' && body.png.startsWith('data:image/png;base64,') && body.png.length < 500_000) {
          signatures.set(req.params.sandbox, { kind: 'drawn', png: body.png });
          return { ok: true };
        }
        if (body.kind === 'typed' && typeof body.name === 'string' && body.name.trim().length >= 2) {
          signatures.set(req.params.sandbox, { kind: 'typed', name: body.name.trim() });
          return { ok: true };
        }
        return reply.code(400).send({ error: 'Sign by drawing or type your full name.' });
      });
    },
    clear(sandbox: string) {
      signatures.delete(sandbox);
    },
  };
}
