import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { CLOSE_UNKNOWN_SANDBOX, createHub } from './hub.ts';
import { openStore } from './store.ts';
import { registerTestHooks } from './test-hooks.ts';
import { messageInput } from './validation.ts';

export type AppOptions = {
  dbPath?: string;
  testHooks?: boolean;
  clientDir?: string;
  sandboxTtlMs?: number;
};

type Params = { sandbox: string };

export async function buildApp(opts: AppOptions = {}) {
  const store = openStore(opts.dbPath ?? ':memory:');
  const hub = createHub();
  const app = Fastify();

  await app.register(fastifyWebsocket);

  app.get('/api/health', async () => ({ ok: true, commit: process.env.RENDER_GIT_COMMIT ?? null }));

  app.post('/api/sandboxes', async (_req, reply) => {
    const id = randomBytes(6).toString('hex');
    store.createSandbox(id);
    return reply.code(201).send({ id });
  });

  app.register(
    async (scope) => {
      scope.addHook('preHandler', async (req, reply) => {
        const { sandbox } = req.params as Params;
        if (!store.hasSandbox(sandbox) && !req.ws) {
          return reply.code(404).send({ error: 'unknown sandbox' });
        }
      });

      scope.get<{ Params: Params; Querystring: { since?: string } }>('/messages', async (req) => ({
        messages: store.messagesSince(req.params.sandbox, Number(req.query.since ?? 0) || 0),
      }));

      scope.post<{ Params: Params }>('/messages', async (req, reply) => {
        const input = messageInput(req.body);
        if (!input) return reply.code(400).send({ error: 'name and text are required' });
        const msg = store.addMessage(req.params.sandbox, input.name, input.text);
        hub.broadcast(req.params.sandbox, msg);
        return reply.code(201).send(msg);
      });

      scope.get<{ Params: Params; Querystring: { name?: string; since?: string } }>(
        '/ws',
        { websocket: true },
        (socket, req) => {
          const { sandbox } = req.params;
          if (!store.hasSandbox(sandbox)) {
            socket.close(CLOSE_UNKNOWN_SANDBOX);
            return;
          }
          hub.join(sandbox, socket, req.query.name ?? 'anonymous');
          for (const msg of store.messagesSince(sandbox, Number(req.query.since ?? 0) || 0)) {
            socket.send(JSON.stringify({ type: 'msg', ...msg }));
          }
          socket.send(JSON.stringify({ type: 'ready' }));
        },
      );
    },
    { prefix: '/api/s/:sandbox' },
  );

  if (opts.testHooks) registerTestHooks(app, store, hub);

  if (opts.clientDir && existsSync(join(opts.clientDir, 'index.html'))) {
    await app.register(fastifyStatic, { root: opts.clientDir, wildcard: false });
    app.setNotFoundHandler((req, reply) => {
      if (req.method === 'GET' && !req.url.startsWith('/api/') && !req.url.startsWith('/__test__/')) {
        return reply.sendFile('index.html');
      }
      return reply.code(404).send({ error: 'not found' });
    });
  }

  const ttl = opts.sandboxTtlMs ?? 24 * 60 * 60 * 1000;
  const pruneTimer = setInterval(() => {
    for (const id of store.pruneOlderThan(Date.now() - ttl)) hub.remove(id);
  }, Math.min(ttl, 60 * 60 * 1000));
  pruneTimer.unref();

  app.addHook('onClose', async () => {
    clearInterval(pruneTimer);
    store.close();
  });

  return app;
}
