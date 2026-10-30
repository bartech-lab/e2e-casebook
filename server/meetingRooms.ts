import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Step = 'book' | 'invite' | 'list';

export type MeetingRooms = ReturnType<typeof createMeetingRooms>;

const TIMES = ['09:00', '10:00', '11:00'];

export function createMeetingRooms() {
  const rooms = new Map<string, Map<string, string>>();
  const failNext = new Map<string, Set<Step>>();
  const stats = new Map<string, { bookAttempts: number; bookings: number; invites: number }>();
  const room = (sandbox: string) => {
    let r = rooms.get(sandbox);
    if (!r) rooms.set(sandbox, (r = new Map()));
    return r;
  };
  const stat = (sandbox: string) => {
    let s = stats.get(sandbox);
    if (!s) stats.set(sandbox, (s = { bookAttempts: 0, bookings: 0, invites: 0 }));
    return s;
  };
  const failing = (sandbox: string, step: Step) => failNext.get(sandbox)?.delete(step) ?? false;
  const slots = (sandbox: string) => TIMES.map((time) => ({ time, booked: room(sandbox).has(time) }));

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/rooms', async (req, reply) => {
        if (failing(req.params.sandbox, 'list')) return reply.code(503).send({ error: 'try again' });
        return { slots: slots(req.params.sandbox) };
      });
      scope.post<{ Params: Params; Body: { time?: unknown } }>('/room-bookings', async (req, reply) => {
        const sandbox = req.params.sandbox;
        stat(sandbox).bookAttempts += 1;
        if (failing(sandbox, 'book')) return reply.code(500).send({ error: 'nothing booked' });
        const time = req.body?.time;
        if (typeof time !== 'string' || !TIMES.includes(time)) return reply.code(400).send({ error: 'unknown time' });
        if (room(sandbox).has(time)) return reply.code(409).send({ error: 'taken' });
        const id = `b${stat(sandbox).bookings + 1}`;
        room(sandbox).set(time, id);
        stat(sandbox).bookings += 1;
        return reply.code(201).send({ id });
      });
      scope.post<{ Params: Params & { id: string } }>('/room-bookings/:id/invite', async (req, reply) => {
        const sandbox = req.params.sandbox;
        if (![...room(sandbox).values()].includes(req.params.id)) return reply.code(404).send({ error: 'no such booking' });
        if (failing(sandbox, 'invite')) return reply.code(502).send({ error: 'calendar down' });
        stat(sandbox).invites += 1;
        return reply.code(202).send({ ok: true });
      });
    },
    failNext(sandbox: string, step: Step) {
      let s = failNext.get(sandbox);
      if (!s) failNext.set(sandbox, (s = new Set()));
      s.add(step);
    },
    stats(sandbox: string) {
      return stat(sandbox);
    },
    clear(sandbox: string) {
      rooms.delete(sandbox);
      failNext.delete(sandbox);
      stats.delete(sandbox);
    },
  };
}
