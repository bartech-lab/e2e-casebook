import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Question = { q: string; a: string };
type Post = { id: number; title: string; body: string; faq: Question[]; pinned: boolean };

export type Posts = ReturnType<typeof createPosts>;

export function createPosts() {
  const posts = new Map<string, Post[]>();
  const of = (sandbox: string) => {
    if (!posts.has(sandbox)) posts.set(sandbox, []);
    return posts.get(sandbox)!;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params }>('/posts', async (req) => ({ posts: of(req.params.sandbox) }));
      scope.post<{ Params: Params }>('/posts', async (req, reply) => {
        const b = (req.body ?? {}) as Partial<Post>;
        const faq = Array.isArray(b.faq) ? b.faq : null;
        if (typeof b.title !== 'string' || !b.title.trim() || typeof b.body !== 'string' || typeof b.pinned !== 'boolean' || !faq) {
          return reply.code(400).send({ error: 'title, body, faq and pinned are required' });
        }
        if (!faq.every((x) => typeof x?.q === 'string' && typeof x?.a === 'string')) return reply.code(400).send({ error: 'faq items need q and a' });
        const list = of(req.params.sandbox);
        const post = { id: list.length + 1, title: b.title.trim(), body: b.body, faq: faq.filter((x) => x.q.trim()), pinned: b.pinned };
        list.push(post);
        return reply.code(201).send(post);
      });
    },
    clear(sandbox: string) {
      posts.delete(sandbox);
    },
  };
}
