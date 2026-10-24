import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Note = { text: string; mentions: number[] };

export type Handover = ReturnType<typeof createHandover>;

export function createHandover() {
  const notes = new Map<string, Note[]>();
  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/handover', async (req) => ({ notes: notes.get(req.params.sandbox) ?? [] }));
      scope.post<{ Params: Params; Body: { text?: unknown; mentions?: unknown } }>('/handover', async (req, reply) => {
        const { text, mentions } = req.body ?? {};
        if (typeof text !== 'string' || !text.trim()) return reply.code(400).send({ error: 'text is required' });
        if (!Array.isArray(mentions) || !mentions.every((m) => Number.isInteger(m) && m >= 1 && m <= 5)) return reply.code(400).send({ error: 'mentions must list people ids' });
        const list = notes.get(req.params.sandbox) ?? [];
        list.push({ text, mentions: [...new Set(mentions as number[])].sort((a, b) => a - b) });
        notes.set(req.params.sandbox, list);
        return { ok: true };
      });
    },
    clear(sandbox: string) {
      notes.delete(sandbox);
    },
  };
}
