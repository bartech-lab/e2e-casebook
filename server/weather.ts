import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

export type Weather = ReturnType<typeof createWeather>;

const REPORTS: Record<string, { tempC: number; sky: string }> = {
  Kraków: { tempC: 12, sky: 'cloudy' },
  Gdańsk: { tempC: 9, sky: 'windy' },
  Zakopane: { tempC: 3, sky: 'snow' },
};

export function createWeather() {
  const counts = new Map<string, number>();
  const failing = new Set<string>();

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params; Querystring: { city?: string } }>('/weather', async (req, reply) => {
        const sandbox = req.params.sandbox;
        counts.set(sandbox, (counts.get(sandbox) ?? 0) + 1);
        if (failing.has(sandbox)) return reply.code(503).send({ error: 'weather service down' });
        const report = REPORTS[req.query.city ?? ''];
        if (!report) return reply.code(404).send({ error: 'no such city' });
        return { city: req.query.city, ...report };
      });
    },
    setFailing(sandbox: string, on: boolean) {
      if (on) failing.add(sandbox);
      else failing.delete(sandbox);
    },
    count(sandbox: string) {
      return counts.get(sandbox) ?? 0;
    },
    clear(sandbox: string) {
      counts.delete(sandbox);
      failing.delete(sandbox);
    },
  };
}
