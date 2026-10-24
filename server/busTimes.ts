import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Departure = { line: string; to: string; time: string };
const START: Departure[] = [
  { line: '160', to: 'Dworzec Główny', time: '07:42' },
  { line: '527', to: 'Ursynów', time: '07:49' },
  { line: '160', to: 'Dworzec Główny', time: '07:57' },
];

export type BusTimes = ReturnType<typeof createBusTimes>;

export function createBusTimes() {
  const boards = new Map<string, Departure[]>();
  const failures = new Map<string, number>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/bus', async (req, reply) => {
        const { sandbox } = req.params;
        reply.header('cache-control', 'no-store');
        const left = failures.get(sandbox) ?? 0;
        if (left > 0) {
          failures.set(sandbox, left - 1);
          return reply.code(500).send({ error: 'Timetable service unavailable.' });
        }
        return { departures: boards.get(sandbox) ?? START };
      });
    },
    setDepartures(sandbox: string, departures: Departure[]) {
      boards.set(sandbox, departures);
      return { departures };
    },
    failNext(sandbox: string, times: number) {
      failures.set(sandbox, times);
      return { failing: times };
    },
    clear(sandbox: string) {
      boards.delete(sandbox);
      failures.delete(sandbox);
    },
  };
}
