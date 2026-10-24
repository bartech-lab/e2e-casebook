import { createHash } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Item = { sku: string; name: string; price: number };
type Logged = { status: number; ifNoneMatch: string | null };

const START: Item[] = [
  { sku: 'beans', name: 'Coffee beans, 1 kg', price: 8900 },
  { sku: 'filter', name: 'Paper filters, 100', price: 1290 },
  { sku: 'kettle', name: 'Gooseneck kettle', price: 21900 },
  { sku: 'scale', name: 'Kitchen scale', price: 7450 },
  { sku: 'mug', name: 'Enamel mug', price: 3900 },
];

export type PriceList = ReturnType<typeof createPriceList>;

export function createPriceList() {
  const lists = new Map<string, Item[]>();
  const logs = new Map<string, Logged[]>();
  const of = (sandbox: string) => {
    if (!lists.has(sandbox)) lists.set(sandbox, START.map((i) => ({ ...i })));
    return lists.get(sandbox)!;
  };
  const log = (sandbox: string) => {
    if (!logs.has(sandbox)) logs.set(sandbox, []);
    return logs.get(sandbox)!;
  };
  const etagOf = (items: Item[]) => `"${createHash('sha1').update(JSON.stringify(items)).digest('hex').slice(0, 16)}"`;

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/price-list', async (req, reply) => {
        const items = of(req.params.sandbox);
        const etag = etagOf(items);
        const ifNoneMatch = req.headers['if-none-match'] ?? null;
        reply.header('etag', etag).header('cache-control', 'no-cache');
        const fresh = ifNoneMatch !== null && ifNoneMatch.split(',').some((t) => t.trim() === etag);
        log(req.params.sandbox).push({ status: fresh ? 304 : 200, ifNoneMatch });
        if (fresh) return reply.code(304).send();
        return { items };
      });
    },
    setPrice(sandbox: string, sku: string, price: number) {
      const item = of(sandbox).find((i) => i.sku === sku);
      if (!item) return null;
      item.price = price;
      return { ...item };
    },
    requests(sandbox: string) {
      return { requests: [...log(sandbox)] };
    },
    clear(sandbox: string) {
      lists.delete(sandbox);
      logs.delete(sandbox);
    },
  };
}
