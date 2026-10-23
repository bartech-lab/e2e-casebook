import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

const DEFAULTS = ['budget.xlsx', 'contract.pdf', 'holiday.jpg', 'notes.txt', 'report.pdf'];

export type Files = ReturnType<typeof createFiles>;

export function createFiles() {
  const lists = new Map<string, string[]>();
  const list = (sandbox: string) => lists.get(sandbox) ?? DEFAULTS;

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/files', async (req) => ({ files: list(req.params.sandbox) }));

      scope.delete<{ Params: Params & { name: string } }>('/files/:name', async (req, reply) => {
        const files = list(req.params.sandbox);
        if (!files.includes(req.params.name)) return reply.code(404).send({ error: 'no such file' });
        lists.set(req.params.sandbox, files.filter((f) => f !== req.params.name));
        return reply.code(204).send();
      });
    },
    clear(sandbox: string) {
      lists.delete(sandbox);
    },
  };
}
