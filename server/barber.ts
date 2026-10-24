import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Hold = { owner: string; expiresAt: number };
type Shop = { holds: Map<string, Hold>; booked: Map<string, string>; offset: number };

export const HOLD_MS = 5 * 60_000;
const SLOTS = [
  ['sat-0900', 'Saturday 09:00'],
  ['sat-0945', 'Saturday 09:45'],
  ['sat-1030', 'Saturday 10:30'],
  ['sat-1115', 'Saturday 11:15'],
] as const;

export type Barber = ReturnType<typeof createBarber>;

export function createBarber() {
  const shops = new Map<string, Shop>();
  const of = (id: string) => shops.get(id) ?? shops.set(id, { holds: new Map(), booked: new Map(), offset: 0 }).get(id)!;
  const now = (s: Shop) => Date.now() + s.offset;
  const liveHold = (s: Shop, slot: string) => {
    const h = s.holds.get(slot);
    return h && h.expiresAt > now(s) ? h : null;
  };
  const nameOf = (body: unknown) => {
    const n = (body as { name?: unknown } | undefined)?.name;
    return typeof n === 'string' && n.trim() ? n.trim() : null;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params; Querystring: { name?: string } }>('/barber/slots', async (req) => {
        const s = of(req.params.sandbox);
        const me = req.query.name ?? '';
        const slots = SLOTS.map(([id, label]) => {
          const booker = s.booked.get(id);
          if (booker) return { id, label, state: booker === me ? 'mine-booked' : 'booked' };
          const h = liveHold(s, id);
          if (!h) return { id, label, state: 'free' };
          return h.owner === me ? { id, label, state: 'mine', expiresAt: h.expiresAt } : { id, label, state: 'held' };
        });
        return { serverNow: now(s), slots };
      });
      scope.post<{ Params: Params; Body: { slot?: unknown } }>('/barber/holds', async (req, reply) => {
        const s = of(req.params.sandbox);
        const name = nameOf(req.body);
        const slot = req.body?.slot;
        if (!name || typeof slot !== 'string' || !SLOTS.some(([id]) => id === slot)) return reply.code(400).send({ error: 'name and a known slot are required' });
        const h = liveHold(s, slot);
        if (s.booked.has(slot) || (h && h.owner !== name)) return reply.code(409).send({ error: 'taken' });
        for (const [id, other] of s.holds) if (other.owner === name && id !== slot) s.holds.delete(id);
        const hold = { owner: name, expiresAt: now(s) + HOLD_MS };
        s.holds.set(slot, hold);
        return { serverNow: now(s), expiresAt: hold.expiresAt };
      });
      scope.post<{ Params: Params; Body: { slot?: unknown } }>('/barber/bookings', async (req, reply) => {
        const s = of(req.params.sandbox);
        const name = nameOf(req.body);
        const slot = req.body?.slot;
        if (!name || typeof slot !== 'string') return reply.code(400).send({ error: 'name and slot are required' });
        const h = liveHold(s, slot);
        if (!h || h.owner !== name || s.booked.has(slot)) return reply.code(409).send({ error: 'expired' });
        s.holds.delete(slot);
        s.booked.set(slot, name);
        return { ok: true };
      });
    },
    advance(sandbox: string, ms: unknown) {
      if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return false;
      of(sandbox).offset += ms;
      return true;
    },
    bookings(sandbox: string) {
      return Object.fromEntries(of(sandbox).booked);
    },
    clear(sandbox: string) {
      shops.delete(sandbox);
    },
  };
}
