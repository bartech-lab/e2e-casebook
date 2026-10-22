import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Booking = { id: string; checkIn: string; nights: number; adults: number; children: number; total: number };

const inRange = (v: unknown, min: number, max: number) => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

export type Bookings = ReturnType<typeof createBookings>;

export function createBookings() {
  const books = new Map<string, Booking[]>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/bookings', async (req) => ({ bookings: books.get(req.params.sandbox) ?? [] }));

      scope.post<{ Params: Params }>('/bookings', async (req, reply) => {
        const { checkIn, nights, adults, children } = (req.body ?? {}) as Record<string, unknown>;
        if (typeof checkIn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !inRange(nights, 1, 14) || !inRange(adults, 1, 4) || !inRange(children, 0, 3)) {
          return reply.code(400).send({ error: 'checkIn YYYY-MM-DD, nights 1-14, adults 1-4, children 0-3' });
        }
        const list = books.get(req.params.sandbox) ?? [];
        const n = nights as number;
        const booking = { id: `BK-${list.length + 1}`, checkIn, nights: n, adults: adults as number, children: children as number, total: n * (15000 * (adults as number) + 7500 * (children as number)) };
        list.push(booking);
        books.set(req.params.sandbox, list);
        return reply.code(201).send(booking);
      });
    },
    clear(sandbox: string) {
      books.delete(sandbox);
    },
  };
}
