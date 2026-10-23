import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Ticket = { text: string; images: { type: string; bytes: number }[] };

const MAX_IMAGES = 3;
const IMAGE = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/;

export type Tickets = ReturnType<typeof createTickets>;

export function createTickets() {
  const latest = new Map<string, Ticket>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/tickets/latest', async (req, reply) => latest.get(req.params.sandbox) ?? reply.code(404).send({ error: 'No ticket yet.' }));

      scope.post<{ Params: Params }>('/tickets', { bodyLimit: 8 * 1024 * 1024 }, async (req, reply) => {
        const { text, images } = (req.body ?? {}) as { text?: unknown; images?: unknown };
        if (typeof text !== 'string' || !text.trim()) return reply.code(400).send({ error: 'Describe the problem.' });
        if (!Array.isArray(images) || images.length > MAX_IMAGES) return reply.code(400).send({ error: 'Attach at most 3 images.' });
        const parsed = images.map((i) => (typeof i === 'string' ? IMAGE.exec(i) : null));
        if (parsed.some((m) => !m)) return reply.code(400).send({ error: 'Only PNG or JPEG images can be attached.' });
        const ticket = { text: text.trim(), images: parsed.map((m) => ({ type: m![1]!, bytes: Buffer.from(m![2]!, 'base64').length })) };
        latest.set(req.params.sandbox, ticket);
        return reply.code(201).send(ticket);
      });
    },
    clear(sandbox: string) {
      latest.delete(sandbox);
    },
  };
}
