import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

export type Releases = ReturnType<typeof createReleases>;

export function createReleases() {
  const versions = new Map<string, number>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/version', async (req) => ({ version: versions.get(req.params.sandbox) ?? 1 }));
    },
    release(sandbox: string) {
      const next = (versions.get(sandbox) ?? 1) + 1;
      versions.set(sandbox, next);
      return next;
    },
    clear(sandbox: string) {
      versions.delete(sandbox);
    },
  };
}
