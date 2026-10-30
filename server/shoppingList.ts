import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type IdParams = Params & { id: string };
type Item = { id: string; name: string; done: boolean };

export type ShoppingList = ReturnType<typeof createShoppingList>;

export function createShoppingList() {
  const lists = new Map<string, { items: Item[]; next: number }>();
  const delay = new Map<string, number>();
  const failNext = new Set<string>();
  const list = (sandbox: string) => {
    let l = lists.get(sandbox);
    if (!l) lists.set(sandbox, (l = { items: [], next: 1 }));
    return l;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/shopping', async (req) => ({ items: list(req.params.sandbox).items }));
      scope.post<{ Params: Params; Body: { name?: unknown } }>('/shopping', async (req, reply) => {
        const sandbox = req.params.sandbox;
        const wait = delay.get(sandbox) ?? 0;
        if (wait) await new Promise((r) => setTimeout(r, wait));
        if (failNext.delete(sandbox)) return reply.code(500).send({ error: 'not added' });
        const name = req.body?.name;
        if (typeof name !== 'string' || !name.trim()) return reply.code(400).send({ error: 'name' });
        const l = list(sandbox);
        const item = { id: `i${l.next++}`, name: name.trim(), done: false };
        l.items.push(item);
        return reply.code(201).send(item);
      });
      scope.patch<{ Params: IdParams; Body: { done?: unknown } }>('/shopping/:id', async (req, reply) => {
        const item = list(req.params.sandbox).items.find((i) => i.id === req.params.id);
        if (!item) return reply.code(404).send({ error: 'no such item' });
        if (typeof req.body?.done === 'boolean') item.done = req.body.done;
        return item;
      });
      scope.delete<{ Params: IdParams }>('/shopping/:id', async (req, reply) => {
        const l = list(req.params.sandbox);
        const i = l.items.findIndex((x) => x.id === req.params.id);
        if (i < 0) return reply.code(404).send({ error: 'no such item' });
        l.items.splice(i, 1);
        return reply.code(204).send();
      });
    },
    setDelay(sandbox: string, ms: number) {
      delay.set(sandbox, ms);
    },
    failNextAdd(sandbox: string) {
      failNext.add(sandbox);
    },
    clear(sandbox: string) {
      lists.delete(sandbox);
      delay.delete(sandbox);
      failNext.delete(sandbox);
    },
  };
}
