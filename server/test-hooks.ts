import type { FastifyInstance } from 'fastify';
import type { Hub } from './hub.ts';
import type { Store } from './store.ts';
import { messageInput } from './validation.ts';

type Params = { sandbox: string };

export function registerTestHooks(app: FastifyInstance, store: Store, hub: Hub) {
  app.register(
    async (scope) => {
      scope.addHook('preHandler', async (req, reply) => {
        const { sandbox } = req.params as Params;
        if (!store.hasSandbox(sandbox)) return reply.code(404).send({ error: 'unknown sandbox' });
      });

      scope.post<{ Params: Params }>('/reset', async (req) => {
        store.clearMessages(req.params.sandbox);
        hub.reset(req.params.sandbox);
        return { ok: true };
      });

      scope.post<{ Params: Params; Body: { messages: unknown[] } }>('/seed', async (req, reply) => {
        const inputs = Array.isArray(req.body?.messages) ? req.body.messages.map(messageInput) : [null];
        if (inputs.some((m) => m === null)) return reply.code(400).send({ error: 'invalid messages' });
        const messages = inputs.map((m) => {
          const msg = store.addMessage(req.params.sandbox, m!.name, m!.text);
          hub.broadcast(req.params.sandbox, msg);
          return msg;
        });
        return { messages };
      });

      scope.post<{ Params: Params; Body: { dropSockets?: string; broadcastDelayMs?: number } }>(
        '/fault',
        async (req) => {
          const { dropSockets, broadcastDelayMs } = req.body ?? {};
          if (typeof broadcastDelayMs === 'number') hub.setBroadcastDelay(req.params.sandbox, broadcastDelayMs);
          if (typeof dropSockets === 'string') hub.drop(req.params.sandbox, dropSockets);
          return { ok: true };
        },
      );
    },
    { prefix: '/__test__/s/:sandbox' },
  );
}
