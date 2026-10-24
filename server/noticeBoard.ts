import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Notice = { id: number; title: string; body: string; read: boolean };

const NOTICES: [string, string][] = [
  ['Kitchen rota', 'From Monday the kitchen rota moves to the board by the lifts. Check your week before Friday.'],
  ['Fire drill', 'There is a fire drill on Wednesday at 10:30. Leave by the nearest stairs and meet in the car park.'],
  ['New printer', 'The printer on the second floor is replaced. Your badge now releases your print jobs.'],
  ['Parking', 'The car park is closed on Saturday for resurfacing. Park on Mill Street instead.'],
  ['Summer party', 'The summer party is on 18 July in the garden. Reply to Ola by the end of June.'],
  ['Heating', 'The heating is serviced next Tuesday, so the third floor may be cold in the morning.'],
  ['Bike shed', 'The bike shed has a new code. Ask at reception, it is not sent by email.'],
  ['Lost property', 'A blue umbrella and a set of keys are at reception. Unclaimed items go to charity in a month.'],
];

export type NoticeBoard = ReturnType<typeof createNoticeBoard>;

export function createNoticeBoard() {
  const read = new Map<string, Map<number, number>>();
  const sends = (sandbox: string) => read.get(sandbox) ?? read.set(sandbox, new Map()).get(sandbox)!;
  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/notices', async (req) => {
        const s = sends(req.params.sandbox);
        const notices: Notice[] = NOTICES.map(([title, body], i) => ({ id: i + 1, title, body, read: s.has(i + 1) }));
        return { notices };
      });
      scope.post<{ Params: Params; Body: { ids?: unknown } }>('/notices/read', async (req, reply) => {
        const ids = req.body?.ids;
        if (!Array.isArray(ids) || !ids.every((id) => Number.isInteger(id) && id >= 1 && id <= NOTICES.length)) {
          return reply.code(400).send({ error: 'ids must list notice ids' });
        }
        const s = sends(req.params.sandbox);
        for (const id of ids as number[]) s.set(id, (s.get(id) ?? 0) + 1);
        return { ok: true };
      });
    },
    reads(sandbox: string) {
      return Object.fromEntries(sends(sandbox));
    },
    clear(sandbox: string) {
      read.delete(sandbox);
    },
  };
}
