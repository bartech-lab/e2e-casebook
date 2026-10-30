import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string; home: string };
const HOMES: Record<string, { name: string; town: string; sleeps: number; price: number; about: string }> = {
  'sea-view': { name: 'Sea view cottage', town: 'Łeba', sleeps: 4, price: 420, about: 'Two bedrooms, a garden and the beach five minutes away.' },
  'forest-cabin': { name: 'Forest cabin', town: 'Białowieża', sleeps: 2, price: 280, about: 'A wood stove, no television, and bison at dawn.' },
  'old-town-flat': { name: 'Old town flat', town: 'Kraków', sleeps: 3, price: 360, about: 'Third floor, no lift, a view of the Market Square.' },
  'lake-house': { name: 'Lake house', town: 'Giżycko', sleeps: 6, price: 640, about: 'A jetty, two kayaks and a sauna by the water.' },
};

export type HolidayHomes = ReturnType<typeof createHolidayHomes>;

export function createHolidayHomes() {
  const views = new Map<string, Record<string, number>>();
  const of = (sandbox: string) => views.get(sandbox) ?? {};

  return {
    register(scope: FastifyInstance) {
      scope.get('/holiday-homes', async () => ({ homes: Object.entries(HOMES).map(([id, h]) => ({ id, name: h.name, town: h.town })) }));
      scope.get<{ Params: Params }>('/holiday-homes/:home', async (req, reply) => {
        const h = HOMES[req.params.home];
        if (!h) return reply.code(404).send({ error: 'no such home' });
        return { id: req.params.home, ...h };
      });
      scope.post<{ Params: Params }>('/holiday-homes/:home/views', async (req, reply) => {
        if (!HOMES[req.params.home]) return reply.code(404).send({ error: 'no such home' });
        views.set(req.params.sandbox, { ...of(req.params.sandbox), [req.params.home]: (of(req.params.sandbox)[req.params.home] ?? 0) + 1 });
        return reply.code(204).send();
      });
      scope.get<{ Params: Params }>('/holiday-home-views', async (req) => ({ views: of(req.params.sandbox) }));
    },
    clear(sandbox: string) {
      views.delete(sandbox);
    },
  };
}
