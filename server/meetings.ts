import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Meeting = { id: number; title: string; zone: string; minutes: number; starts: string[] };

function offsetMs(zone: string, at: number) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' })
      .formatToParts(at)
      .map((p) => [p.type, Number(p.value)]),
  );
  return Date.UTC(parts.year!, parts.month! - 1, parts.day!, parts.hour!, parts.minute!, parts.second!) - at;
}

export function wallToUtc(date: string, time: string, zone: string) {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const [hh, mm] = time.split(':').map(Number) as [number, number];
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  const first = wall - offsetMs(zone, wall);
  return wall - offsetMs(zone, first);
}

export function addDays(date: string, days: number) {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export type Meetings = ReturnType<typeof createMeetings>;

export function createMeetings() {
  const all = new Map<string, Meeting[]>();
  const list = (sandbox: string) => {
    if (!all.has(sandbox)) all.set(sandbox, []);
    return all.get(sandbox)!;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/meetings', async (req) => list(req.params.sandbox));

      scope.post<{ Params: Params }>('/meetings', async (req, reply) => {
        const { title, date, time, zone, weeks, minutes } = (req.body ?? {}) as Record<string, unknown>;
        if (typeof title !== 'string' || !title.trim()) return reply.code(400).send({ error: 'Give the meeting a title.' });
        if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return reply.code(400).send({ error: 'date must be YYYY-MM-DD' });
        if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) return reply.code(400).send({ error: 'time must be HH:MM' });
        if (typeof zone !== 'string' || !Intl.supportedValuesOf('timeZone').includes(zone)) return reply.code(400).send({ error: 'Unknown time zone.' });
        const count = weeks === undefined ? 1 : Number(weeks);
        if (!Number.isInteger(count) || count < 1 || count > 12) return reply.code(400).send({ error: 'weeks must be 1 to 12' });
        const length = minutes === undefined ? 30 : Number(minutes);
        const meetings = list(req.params.sandbox);
        const starts = Array.from({ length: count }, (_, i) => new Date(wallToUtc(addDays(date, 7 * i), time, zone)).toISOString());
        const meeting = { id: meetings.length + 1, title: title.trim(), zone, minutes: length, starts };
        meetings.push(meeting);
        return meeting;
      });
    },
    clear(sandbox: string) {
      all.delete(sandbox);
    },
  };
}
