import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

export type NotesSchema = ReturnType<typeof createNotesSchema>;

export function createNotesSchema() {
  const versions = new Map<string, number>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/notes-schema', async (req) => ({ version: versions.get(req.params.sandbox) ?? 1 }));
    },
    setVersion(sandbox: string, version: number) {
      versions.set(sandbox, version);
      return { version };
    },
    clear(sandbox: string) {
      versions.delete(sandbox);
    },
  };
}
