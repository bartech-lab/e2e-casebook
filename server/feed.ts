import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Post = { id: number; text: string };

const SEEDED = 35;
const PAGE = 10;

export type Feed = ReturnType<typeof createFeed>;

export function createFeed() {
  const feeds = new Map<string, Post[]>();
  const feed = (sandbox: string) => {
    let posts = feeds.get(sandbox);
    if (!posts) feeds.set(sandbox, (posts = Array.from({ length: SEEDED }, (_, i) => ({ id: i + 1, text: `Post ${i + 1}` }))));
    return posts;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params; Querystring: { before?: string; after?: string; offset?: string } }>('/feed', async (req) => {
        const posts = feed(req.params.sandbox);
        if (req.query.after !== undefined) {
          const after = Number(req.query.after);
          return { posts: posts.filter((p) => p.id > after).reverse(), more: false };
        }
        if (req.query.offset !== undefined) {
          const all = [...posts].reverse();
          const offset = Number(req.query.offset) || 0;
          return { posts: all.slice(offset, offset + PAGE), more: all.length > offset + PAGE };
        }
        const before = req.query.before === undefined ? Infinity : Number(req.query.before);
        const older = posts.filter((p) => p.id < before).reverse();
        return { posts: older.slice(0, PAGE), more: older.length > PAGE };
      });

      scope.post<{ Params: Params }>('/feed', async (req, reply) => {
        const text = (req.body as { text?: unknown } | undefined)?.text;
        if (typeof text !== 'string' || !text.trim() || text.length > 200) return reply.code(400).send({ error: 'text of 1 to 200 characters' });
        const posts = feed(req.params.sandbox);
        const post = { id: posts.length + 1, text: text.trim() };
        posts.push(post);
        return reply.code(201).send(post);
      });
    },
    clear(sandbox: string) {
      feeds.delete(sandbox);
    },
  };
}
