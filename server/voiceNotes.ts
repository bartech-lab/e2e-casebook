import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Note = { id: number; bytes: number; durationMs: number; audio: Buffer };
const MAX_MS = 30_000;

export type VoiceNotes = ReturnType<typeof createVoiceNotes>;

export function createVoiceNotes() {
  const notes = new Map<string, Note[]>();
  const of = (sandbox: string) => {
    if (!notes.has(sandbox)) notes.set(sandbox, []);
    return notes.get(sandbox)!;
  };
  const summary = ({ id, bytes, durationMs }: Note) => ({ id, bytes, durationMs });

  return {
    register(scope: FastifyInstance) {
      scope.addContentTypeParser('audio/webm', { parseAs: 'buffer', bodyLimit: 4 * 1024 * 1024 }, (_req, body, done) => done(null, body));
      scope.get<{ Params: Params }>('/voice-notes', async (req) => ({ notes: of(req.params.sandbox).map(summary) }));
      scope.post<{ Params: Params; Querystring: { durationMs?: string } }>('/voice-notes', async (req, reply) => {
        const audio = req.body;
        const durationMs = Number(req.query.durationMs);
        if (!Buffer.isBuffer(audio) || audio.length === 0) return reply.code(400).send({ error: 'The recording is empty.' });
        if (!Number.isInteger(durationMs) || durationMs <= 0 || durationMs > MAX_MS + 1_000) {
          return reply.code(400).send({ error: 'durationMs must be between 1 and 31000' });
        }
        const list = of(req.params.sandbox);
        const note = { id: list.length + 1, bytes: audio.length, durationMs, audio };
        list.push(note);
        return reply.code(201).send(summary(note));
      });
      scope.get<{ Params: Params & { id: string } }>('/voice-notes/:id/audio', async (req, reply) => {
        const note = of(req.params.sandbox).find((n) => n.id === Number(req.params.id));
        if (!note) return reply.code(404).send({ error: 'No such voice note' });
        return reply.type('audio/webm').send(note.audio);
      });
    },
    clear(sandbox: string) {
      notes.delete(sandbox);
    },
  };
}
