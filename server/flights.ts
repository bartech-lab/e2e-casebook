import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Stats = { started: number; completed: number; aborted: number };

const FLIGHTS = [
  { code: 'LO 281', from: 'WAW', to: 'LHR', departs: '07:10', price: 489 },
  { code: 'BA 851', from: 'WAW', to: 'LHR', departs: '13:45', price: 612 },
  { code: 'AF 1147', from: 'WAW', to: 'CDG', departs: '09:30', price: 538 },
  { code: 'LO 335', from: 'KRK', to: 'CDG', departs: '06:55', price: 455 },
  { code: 'AF 1747', from: 'KRK', to: 'CDG', departs: '17:20', price: 579 },
  { code: 'FR 2441', from: 'KRK', to: 'LHR', departs: '11:05', price: 219 },
];

export type Flights = ReturnType<typeof createFlights>;

export function createFlights() {
  const paces = new Map<string, number>();
  const stats = new Map<string, Stats>();
  const of = (id: string) => stats.get(id) ?? stats.set(id, { started: 0, completed: 0, aborted: 0 }).get(id)!;
  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params; Querystring: { from?: string; to?: string } }>('/flights', async (req, reply) => {
        const s = of(req.params.sandbox);
        s.started++;
        reply.raw.on('close', () => {
          if (!reply.raw.writableEnded) s.aborted++;
        });
        const pace = paces.get(req.params.sandbox) ?? 0;
        if (pace) await new Promise((r) => setTimeout(r, pace));
        if (reply.raw.destroyed) {
          reply.hijack();
          return;
        }
        s.completed++;
        return { flights: FLIGHTS.filter((f) => f.from === req.query.from && f.to === req.query.to) };
      });
    },
    setPace(sandbox: string, ms: unknown) {
      if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0 || ms > 120_000) return false;
      paces.set(sandbox, ms);
      return true;
    },
    stats(sandbox: string) {
      return of(sandbox);
    },
    clear(sandbox: string) {
      paces.delete(sandbox);
      stats.delete(sandbox);
    },
  };
}
