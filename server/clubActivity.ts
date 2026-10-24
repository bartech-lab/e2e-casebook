import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Event = { text: string; at: string };

export type ClubActivity = ReturnType<typeof createClubActivity>;

export function createClubActivity() {
  const feeds = new Map<string, Event[]>();
  const defaults = (): Event[] => [
    { text: 'Ola booked court 2', at: new Date(Date.now() - 3 * 60_000).toISOString() },
    { text: 'Marek joined the club', at: new Date(Date.now() - 2 * 3_600_000).toISOString() },
  ];
  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/club-activity', async (req) => ({ events: feeds.get(req.params.sandbox) ?? defaults() }));
    },
    seed(sandbox: string, events: unknown) {
      if (!Array.isArray(events) || !events.every((e) => e && typeof e.text === 'string' && typeof e.at === 'string' && !Number.isNaN(Date.parse(e.at)))) return false;
      feeds.set(sandbox, events.map((e: Event) => ({ text: e.text, at: new Date(e.at).toISOString() })));
      return true;
    },
    clear(sandbox: string) {
      feeds.delete(sandbox);
    },
  };
}
