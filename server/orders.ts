import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Order = { number: number; customer: string; total: number; date: string };
type Column = 'number' | 'customer' | 'total' | 'date';

const PER_PAGE = 10;
const COLUMNS: Column[] = ['number', 'customer', 'total', 'date'];
const NAMES = ['Ann', 'Piotr', 'Ewa', 'Jan', 'Ola'];

function defaults(): Order[] {
  return Array.from({ length: 23 }, (_, i) => ({
    number: 1001 + i,
    customer: NAMES[(i * 3) % NAMES.length]!,
    total: ((i * 7919) % 50000) + 500,
    date: `2026-09-${String(1 + ((i * 11) % 28)).padStart(2, '0')}`,
  }));
}

export function sortOrders(orders: Order[], column: Column, dir: 'asc' | 'desc') {
  const sign = dir === 'asc' ? 1 : -1;
  return [...orders].sort((a, b) => {
    const x = a[column];
    const y = b[column];
    const by = typeof x === 'number' ? x - (y as number) : String(x).localeCompare(String(y));
    return by * sign || a.number - b.number;
  });
}

export type Orders = ReturnType<typeof createOrders>;

export function createOrders() {
  const lists = new Map<string, Order[]>();
  const list = (sandbox: string) => lists.get(sandbox) ?? defaults();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params; Querystring: { sort?: string; dir?: string; page?: string } }>('/order-list', async (req, reply) => {
        const column = (req.query.sort ?? 'number') as Column;
        const dir = req.query.dir ?? 'asc';
        const page = Number(req.query.page ?? 1);
        if (!COLUMNS.includes(column) || (dir !== 'asc' && dir !== 'desc') || !Number.isInteger(page) || page < 1) {
          return reply.code(400).send({ error: 'sort, dir or page is not valid' });
        }
        const all = sortOrders(list(req.params.sandbox), column, dir);
        const pages = Math.max(1, Math.ceil(all.length / PER_PAGE));
        return { orders: all.slice((page - 1) * PER_PAGE, page * PER_PAGE), page, pages, count: all.length };
      });
    },
    seed(sandbox: string, orders: Order[]) {
      lists.set(sandbox, orders);
    },
    clear(sandbox: string) {
      lists.delete(sandbox);
    },
  };
}
