import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Song = { id: number; title: string; others: number; liked: boolean };
type State = { songs: Song[]; paces: number[]; next: number; fail: number; writes: { id: number; liked: boolean }[] };

const SONGS: [string, number, boolean][] = [
  ['Morning Tram', 12, false],
  ['Rain on the Vistula', 7, true],
  ['Last Ferry Home', 3, false],
];

export type Songs = ReturnType<typeof createSongs>;

export function createSongs() {
  const states = new Map<string, State>();
  const of = (id: string) =>
    states.get(id) ??
    states
      .set(id, { songs: SONGS.map(([title, others, liked], i) => ({ id: i + 1, title, others, liked })), paces: [], next: 0, fail: 0, writes: [] })
      .get(id)!;
  const view = (s: Song) => ({ id: s.id, title: s.title, liked: s.liked, likes: s.others + (s.liked ? 1 : 0) });
  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/songs', async (req) => ({ songs: of(req.params.sandbox).songs.map(view) }));
      scope.put<{ Params: Params & { id: string }; Body: { liked?: unknown } }>('/songs/:id/like', async (req, reply) => {
        const st = of(req.params.sandbox);
        const song = st.songs.find((s) => String(s.id) === req.params.id);
        if (!song) return reply.code(404).send({ error: 'No such song.' });
        if (typeof req.body?.liked !== 'boolean') return reply.code(400).send({ error: 'liked must be true or false' });
        const pace = st.paces.length ? st.paces[st.next++ % st.paces.length]! : 0;
        if (pace) await new Promise((r) => setTimeout(r, pace));
        if (st.fail > 0) {
          st.fail--;
          return reply.code(503).send({ error: 'Try again.' });
        }
        song.liked = req.body.liked;
        st.writes.push({ id: song.id, liked: song.liked });
        return view(song);
      });
    },
    setPace(sandbox: string, ms: unknown) {
      if (!Array.isArray(ms) || !ms.every((m) => typeof m === 'number' && m >= 0 && m <= 10_000)) return false;
      const st = of(sandbox);
      st.paces = ms as number[];
      st.next = 0;
      return true;
    },
    setFail(sandbox: string, times: unknown) {
      if (typeof times !== 'number' || !Number.isInteger(times) || times < 0) return false;
      of(sandbox).fail = times;
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
