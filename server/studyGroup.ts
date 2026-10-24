import type { FastifyInstance } from 'fastify';
import type { ServerResponse } from 'node:http';

type Params = { sandbox: string };
type Message = { id: number; name: string; text: string };
type Stream = { name: string; res: ServerResponse };
type Group = { messages: Message[]; typing: Map<string, ReturnType<typeof setTimeout>>; streams: Set<Stream>; signals: number; nextId: number };

const EXPIRES_MS = 3000;

export type StudyGroup = ReturnType<typeof createStudyGroup>;

export function createStudyGroup() {
  const groups = new Map<string, Group>();
  const of = (id: string) =>
    groups.get(id) ?? groups.set(id, { messages: [], typing: new Map(), streams: new Set(), signals: 0, nextId: 1 }).get(id)!;
  const send = (g: Group, event: string, data: unknown) => {
    for (const s of g.streams) s.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  const typers = (g: Group) => [...g.typing.keys()];
  const stop = (g: Group, name: string) => {
    if (!g.typing.has(name)) return;
    clearTimeout(g.typing.get(name));
    g.typing.delete(name);
    send(g, 'typing', typers(g));
  };
  const nameOf = (body: unknown) => {
    const name = (body as { name?: unknown } | undefined)?.name;
    return typeof name === 'string' && name.trim() ? name.trim() : null;
  };

  return {
    register(scope: FastifyInstance) {
      scope.get<{ Params: Params; Querystring: { name?: string } }>('/study-group/stream', async (req, reply) => {
        const g = of(req.params.sandbox);
        const stream = { name: req.query.name ?? '', res: reply.raw };
        reply.hijack();
        reply.raw.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
        reply.raw.write(`event: messages\ndata: ${JSON.stringify(g.messages)}\n\n`);
        reply.raw.write(`event: typing\ndata: ${JSON.stringify(typers(g))}\n\n`);
        g.streams.add(stream);
        req.raw.on('close', () => {
          g.streams.delete(stream);
          if (![...g.streams].some((s) => s.name === stream.name)) stop(g, stream.name);
        });
      });
      scope.post<{ Params: Params }>('/study-group/typing', async (req, reply) => {
        const name = nameOf(req.body);
        if (!name) return reply.code(400).send({ error: 'name is required' });
        const g = of(req.params.sandbox);
        g.signals++;
        const fresh = !g.typing.has(name);
        clearTimeout(g.typing.get(name));
        g.typing.set(name, setTimeout(() => stop(g, name), EXPIRES_MS));
        if (fresh) send(g, 'typing', typers(g));
        return { ok: true };
      });
      scope.post<{ Params: Params }>('/study-group/typing/stop', async (req, reply) => {
        const name = nameOf(req.body);
        if (!name) return reply.code(400).send({ error: 'name is required' });
        stop(of(req.params.sandbox), name);
        return { ok: true };
      });
      scope.post<{ Params: Params }>('/study-group/messages', async (req, reply) => {
        const name = nameOf(req.body);
        const text = (req.body as { text?: unknown } | undefined)?.text;
        if (!name || typeof text !== 'string' || !text.trim()) return reply.code(400).send({ error: 'name and text are required' });
        const g = of(req.params.sandbox);
        stop(g, name);
        const message = { id: g.nextId++, name, text: text.trim() };
        g.messages.push(message);
        send(g, 'message', message);
        return message;
      });
    },
    signals(sandbox: string) {
      return of(sandbox).signals;
    },
    clear(sandbox: string) {
      const g = groups.get(sandbox);
      if (!g) return;
      for (const t of g.typing.values()) clearTimeout(t);
      for (const s of g.streams) s.res.end();
      groups.delete(sandbox);
    },
  };
}
