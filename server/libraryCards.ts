import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Application = { birthDate: string; parentEmail?: string };

export type LibraryCards = ReturnType<typeof createLibraryCards>;

export function createLibraryCards() {
  const apps = new Map<string, Application[]>();
  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/library-cards', async (req) => ({ applications: apps.get(req.params.sandbox) ?? [] }));
      scope.post<{ Params: Params }>('/library-cards', async (req, reply) => {
        const body = req.body as Partial<Record<string, unknown>> | undefined;
        if (typeof body?.birthDate !== 'string') return reply.code(400).send({ error: 'birthDate is required' });
        if (body.parentEmail !== undefined && typeof body.parentEmail !== 'string') return reply.code(400).send({ error: 'parentEmail must be a string' });
        const app: Application = { birthDate: body.birthDate };
        if (body.parentEmail !== undefined) app.parentEmail = body.parentEmail as string;
        const list = apps.get(req.params.sandbox) ?? [];
        list.push(app);
        apps.set(req.params.sandbox, list);
        return { ok: true };
      });
    },
    clear(sandbox: string) {
      apps.delete(sandbox);
    },
  };
}
