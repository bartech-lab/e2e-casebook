import type { FastifyInstance } from 'fastify';
import { png } from './roomPhotos.ts';

type Params = { sandbox: string };
type Message = { id: number; from: string; text: string; image?: { height: number } };
const NAMES = ['Ola', 'Marek', 'Ewa', 'Piotr'];
const START: Message[] = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  from: NAMES[i % NAMES.length]!,
  text: `Message ${i + 1} about the trip.`,
  ...(i % 5 === 3 || i === 23 ? { image: { height: 140 + ((i * 37) % 160) } } : {}),
}));

export type TeamChat = ReturnType<typeof createTeamChat>;

export function createTeamChat() {
  const extra = new Map<string, Message[]>();
  const all = (sandbox: string) => [...START, ...(extra.get(sandbox) ?? [])];
  const images = new Map<string, Buffer>();

  function post(sandbox: string, message: Omit<Message, 'id'>) {
    const list = extra.get(sandbox) ?? [];
    const m = { ...message, id: START.length + list.length + 1 };
    extra.set(sandbox, [...list, m]);
    return m;
  }

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params; Querystring: { after?: string } }>('/team-chat', async (req) => {
        const after = Number(req.query.after ?? 0) || 0;
        return { messages: all(req.params.sandbox).filter((m) => m.id > after) };
      });
      scope.post<{ Params: Params; Body: { text?: string } }>('/team-chat', async (req, reply) => {
        const text = (req.body?.text ?? '').trim();
        if (!text) return reply.code(400).send({ error: 'text is required' });
        return reply.code(201).send(post(req.params.sandbox, { from: 'You', text }));
      });
      scope.get<{ Params: Params & { height: string } }>('/team-chat/images/:height', async (req, reply) => {
        const height = Math.min(Math.max(Number(req.params.height) || 100, 20), 600);
        await new Promise((r) => setTimeout(r, 400 + (height % 7) * 60));
        const key = String(height);
        const body = images.get(key) ?? images.set(key, png(240, height, [120, 160, 200])).get(key)!;
        return reply.type('image/png').header('cache-control', 'no-store').send(body);
      });
    },
    post,
    clear(sandbox: string) {
      extra.delete(sandbox);
    },
  };
}
