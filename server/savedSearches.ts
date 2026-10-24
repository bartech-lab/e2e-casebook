import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Search = { id: number; name: string };

export type SavedSearches = ReturnType<typeof createSavedSearches>;

export function createSavedSearches() {
  const lists = new Map<string, Search[]>();
  const delays = new Map<string, number>();
  const of = (sandbox: string) => {
    if (!lists.has(sandbox)) lists.set(sandbox, []);
    return lists.get(sandbox)!;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/saved-searches', async (req) => {
        await new Promise((r) => setTimeout(r, delays.get(req.params.sandbox) ?? 200));
        return { searches: of(req.params.sandbox) };
      });
      scope.post<{ Params: Params; Body: { name?: unknown } }>('/saved-searches', async (req) => {
        const list = of(req.params.sandbox);
        const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim() : `Untitled search ${list.length + 1}`;
        const search = { id: list.length + 1, name };
        list.push(search);
        return search;
      });
    },
    seed(sandbox: string, names: string[]) {
      lists.set(sandbox, names.map((name, i) => ({ id: i + 1, name })));
      return { searches: of(sandbox) };
    },
    setDelay(sandbox: string, ms: number) {
      delays.set(sandbox, ms);
      return { delayMs: ms };
    },
    clear(sandbox: string) {
      lists.delete(sandbox);
      delays.delete(sandbox);
    },
  };
}
