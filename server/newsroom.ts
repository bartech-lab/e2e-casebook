import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Story = { id: number; title: string; body: string };
const TOPICS = ['Tram line 7 reopens', 'New bike lanes on Grójecka', 'Library extends opening hours', 'Heatwave warning lifted', 'Market hall gets a new roof', 'School year starts early', 'River clean-up on Saturday', 'Night buses change routes'];
const START = 35;

const make = (id: number): Story => ({ id, title: `${TOPICS[id % TOPICS.length]} (${id})`, body: `Story number ${id}. ${TOPICS[id % TOPICS.length]}.` });

export type Newsroom = ReturnType<typeof createNewsroom>;

export function createNewsroom() {
  const latest = new Map<string, number>();
  const newest = (sandbox: string) => latest.get(sandbox) ?? START;

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params; Querystring: { before?: string; offset?: string; limit?: string } }>('/news', async (req, reply) => {
        const limit = Math.min(Number(req.query.limit ?? 10) || 10, 50);
        const top = newest(req.params.sandbox);
        let from: number;
        if (req.query.before !== undefined) from = Number(req.query.before) - 1;
        else from = top - (Number(req.query.offset ?? 0) || 0);
        if (!Number.isInteger(from)) return reply.code(400).send({ error: 'before must be a story id' });
        const ids = [];
        for (let id = Math.min(from, top); id >= 1 && ids.length < limit; id--) ids.push(id);
        return { stories: ids.map((id) => ({ id, title: make(id).title })), more: (ids.at(-1) ?? 1) > 1 };
      });
      scope.get<{ Params: Params & { story: string } }>('/news/:story', async (req, reply) => {
        const id = Number(req.params.story);
        if (!Number.isInteger(id) || id < 1 || id > newest(req.params.sandbox)) return reply.code(404).send({ error: 'no such story' });
        return make(id);
      });
    },
    publish(sandbox: string, count: number) {
      latest.set(sandbox, newest(sandbox) + count);
      return { newest: newest(sandbox) };
    },
    clear(sandbox: string) {
      latest.delete(sandbox);
    },
  };
}
