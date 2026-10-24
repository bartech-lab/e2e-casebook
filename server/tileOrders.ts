import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Line = { tile: string; qty: number };
type Order = { id: number; lines: Line[]; total: number };

export const TILE_PRICES: Record<string, number> = { 'white-matt': 89, terracotta: 129, 'blue-metro': 149 };

export type TileOrders = ReturnType<typeof createTileOrders>;

export function createTileOrders() {
  const orders = new Map<string, Order[]>();
  const of = (id: string) => orders.get(id) ?? orders.set(id, []).get(id)!;
  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/tile-orders', async (req) => ({ orders: of(req.params.sandbox) }));
      scope.post<{ Params: Params; Body: { lines?: unknown } }>('/tile-orders', async (req, reply) => {
        const lines = req.body?.lines;
        const valid =
          Array.isArray(lines) &&
          lines.length > 0 &&
          lines.every((l: Line) => l && typeof l.tile === 'string' && l.tile in TILE_PRICES && Number.isInteger(l.qty) && l.qty >= 1 && l.qty <= 99) &&
          new Set(lines.map((l: Line) => l.tile)).size === lines.length;
        if (!valid) return reply.code(400).send({ error: 'An order needs 1 to 99 of each tile, each tile once.' });
        const list = of(req.params.sandbox);
        const order = { id: list.length + 1, lines: (lines as Line[]).map(({ tile, qty }) => ({ tile, qty })), total: (lines as Line[]).reduce((s, l) => s + TILE_PRICES[l.tile]! * l.qty, 0) };
        list.push(order);
        return reply.code(201).send(order);
      });
    },
    clear(sandbox: string) {
      orders.delete(sandbox);
    },
  };
}
