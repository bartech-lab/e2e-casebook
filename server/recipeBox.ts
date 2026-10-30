import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type IdParams = Params & { id: string };
type Recipe = { id: string; title: string; minutes: number };

export type RecipeBox = ReturnType<typeof createRecipeBox>;

const seed = (): Recipe[] => [
  { id: 'r1', title: 'Pancakes', minutes: 20 },
  { id: 'r2', title: 'Żurek', minutes: 90 },
  { id: 'r3', title: 'Pierogi', minutes: 120 },
];

export function createRecipeBox() {
  const books = new Map<string, Recipe[]>();
  const delay = new Map<string, number>();
  const failNext = new Set<string>();
  const book = (sandbox: string) => {
    let b = books.get(sandbox);
    if (!b) books.set(sandbox, (b = seed()));
    return b;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/recipes', async (req) => ({ recipes: book(req.params.sandbox) }));
      scope.get<{ Params: Params }>('/recipes-count', async (req) => ({ count: book(req.params.sandbox).length }));
      scope.get<{ Params: IdParams }>('/recipes/:id', async (req, reply) => {
        const r = book(req.params.sandbox).find((x) => x.id === req.params.id);
        return r ?? reply.code(404).send({ error: 'no such recipe' });
      });
      scope.put<{ Params: IdParams; Body: { title?: unknown; minutes?: unknown } }>('/recipes/:id', async (req, reply) => {
        const sandbox = req.params.sandbox;
        const wait = delay.get(sandbox) ?? 0;
        if (wait) await new Promise((r) => setTimeout(r, wait));
        if (failNext.delete(sandbox)) return reply.code(500).send({ error: 'could not save' });
        const r = book(sandbox).find((x) => x.id === req.params.id);
        if (!r) return reply.code(404).send({ error: 'no such recipe' });
        const { title, minutes } = req.body ?? {};
        if (typeof title !== 'string' || !title.trim() || typeof minutes !== 'number' || !(minutes > 0)) return reply.code(400).send({ error: 'title and minutes' });
        r.title = title.trim();
        r.minutes = minutes;
        return r;
      });
      scope.delete<{ Params: IdParams }>('/recipes/:id', async (req, reply) => {
        const b = book(req.params.sandbox);
        const i = b.findIndex((x) => x.id === req.params.id);
        if (i < 0) return reply.code(404).send({ error: 'no such recipe' });
        b.splice(i, 1);
        return reply.code(204).send();
      });
    },
    setDelay(sandbox: string, ms: number) {
      delay.set(sandbox, ms);
    },
    failNextSave(sandbox: string) {
      failNext.add(sandbox);
    },
    clear(sandbox: string) {
      books.delete(sandbox);
      delay.delete(sandbox);
      failNext.delete(sandbox);
    },
  };
}
