import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Member = { id: number; name: string; role: string; phone: string };
type State = { staff: Member[]; paces: number[]; next: number; writes: Member[] };

const STAFF: [string, string, string][] = [
  ['Ola Nowak', 'Chef', '+48 600 100 201'],
  ['Marek Wiśniewski', 'Waiter', '+48 600 100 202'],
  ['Kasia Zielińska', 'Host', '+48 600 100 203'],
  ['Piotr Kowalczyk', 'Barista', '+48 600 100 204'],
  ['Ania Lewandowska', 'Manager', '+48 600 100 205'],
];

export type Staff = ReturnType<typeof createStaff>;

export function createStaff() {
  const states = new Map<string, State>();
  const of = (id: string) =>
    states.get(id) ??
    states.set(id, { staff: STAFF.map(([name, role, phone], i) => ({ id: i + 1, name, role, phone })), paces: [], next: 0, writes: [] }).get(id)!;
  const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/staff', async (req) => ({ staff: of(req.params.sandbox).staff.map(({ id, name, role }) => ({ id, name, role })) }));
      scope.get<{ Params: Params & { id: string } }>('/staff/:id', async (req, reply) => {
        const st = of(req.params.sandbox);
        const member = st.staff.find((m) => String(m.id) === req.params.id);
        if (!member) return reply.code(404).send({ error: 'No such person.' });
        const pace = st.paces.length ? st.paces[st.next++ % st.paces.length]! : 0;
        if (pace) await new Promise((r) => setTimeout(r, pace));
        return { ...member };
      });
      scope.put<{ Params: Params & { id: string }; Body: { name?: unknown; role?: unknown; phone?: unknown } }>('/staff/:id', async (req, reply) => {
        const st = of(req.params.sandbox);
        const member = st.staff.find((m) => String(m.id) === req.params.id);
        if (!member) return reply.code(404).send({ error: 'No such person.' });
        const name = text(req.body?.name);
        if (!name) return reply.code(400).send({ error: 'Enter a name.' });
        Object.assign(member, { name, role: text(req.body?.role), phone: text(req.body?.phone) });
        st.writes.push({ ...member });
        return { ...member };
      });
    },
    setPace(sandbox: string, ms: unknown) {
      if (!Array.isArray(ms) || !ms.every((m) => typeof m === 'number' && m >= 0 && m <= 10_000)) return false;
      const st = of(sandbox);
      st.paces = ms as number[];
      st.next = 0;
      return true;
    },
    writes(sandbox: string) {
      return of(sandbox).writes;
    },
    clear(sandbox: string) {
      states.delete(sandbox);
    },
  };
}
