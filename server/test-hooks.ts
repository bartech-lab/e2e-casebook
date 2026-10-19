import type { FastifyInstance } from 'fastify';
import type { Exports } from './exports.ts';
import { parseHttpRules, type Faults } from './faults.ts';
import type { Hub } from './hub.ts';
import { DEFAULT_CARDS, type Store } from './store.ts';
import { cardInput, messageInput } from './validation.ts';

type Params = { sandbox: string };
type Deps = { store: Store; hub: Hub; faults: Faults; exportJobs: Exports };

type FaultBody = {
  dropSockets?: unknown;
  broadcastDelayMs?: unknown;
  http?: unknown;
  exports?: { stepMs?: unknown; failAtStep?: unknown; failRuns?: unknown };
};

export function registerTestHooks(app: FastifyInstance, { store, hub, faults, exportJobs }: Deps) {
  app.register(
    async (scope) => {
      scope.addHook('preHandler', async (req, reply) => {
        const { sandbox } = req.params as Params;
        if (!store.hasSandbox(sandbox)) return reply.code(404).send({ error: 'unknown sandbox' });
      });

      scope.post<{ Params: Params }>('/reset', async (req) => {
        const { sandbox } = req.params;
        store.clearMessages(sandbox);
        store.replaceCards(sandbox, DEFAULT_CARDS);
        exportJobs.clear(sandbox);
        faults.clear(sandbox);
        hub.reset(sandbox);
        return { ok: true };
      });

      scope.post<{ Params: Params; Body: { messages?: unknown; cards?: unknown } }>('/seed', async (req, reply) => {
        const { sandbox } = req.params;
        const body = req.body ?? {};
        if (body.messages === undefined && body.cards === undefined) {
          return reply.code(400).send({ error: 'nothing to seed' });
        }
        const messageInputs = body.messages === undefined ? [] : Array.isArray(body.messages) ? body.messages.map(messageInput) : [null];
        const cardInputs = body.cards === undefined ? undefined : Array.isArray(body.cards) ? body.cards.map(cardInput) : [null];
        if (messageInputs.some((m) => m === null) || cardInputs?.some((c) => c === null)) {
          return reply.code(400).send({ error: 'invalid seed' });
        }
        const messages = messageInputs.map((m) => {
          const msg = store.addMessage(sandbox, m!.name, m!.text);
          hub.broadcast(sandbox, msg);
          return msg;
        });
        if (cardInputs) store.replaceCards(sandbox, cardInputs.map((c) => c!));
        return cardInputs ? { messages, cards: store.listCards(sandbox) } : { messages };
      });

      scope.post<{ Params: Params; Body: FaultBody }>('/fault', async (req, reply) => {
        const { sandbox } = req.params;
        const { dropSockets, broadcastDelayMs, http, exports } = req.body ?? {};
        const rules = http === undefined ? [] : parseHttpRules(http);
        if (rules === null) return reply.code(400).send({ error: 'invalid http rules' });
        const exportChange: { stepMs?: number; failAtStep?: number | null; failRuns?: number } = {};
        if (exports !== undefined) {
          const { stepMs, failAtStep, failRuns } = exports;
          if (stepMs !== undefined && (typeof stepMs !== 'number' || stepMs < 10 || stepMs > 10_000)) {
            return reply.code(400).send({ error: 'invalid exports.stepMs' });
          }
          if (failAtStep !== undefined && failAtStep !== null && (typeof failAtStep !== 'number' || failAtStep < 1 || failAtStep > 10)) {
            return reply.code(400).send({ error: 'invalid exports.failAtStep' });
          }
          if (failRuns !== undefined && (typeof failRuns !== 'number' || failRuns < 0)) {
            return reply.code(400).send({ error: 'invalid exports.failRuns' });
          }
          if (stepMs !== undefined) exportChange.stepMs = stepMs as number;
          if (failAtStep !== undefined) {
            exportChange.failAtStep = failAtStep as number | null;
            exportChange.failRuns = failRuns === undefined ? 1 : (failRuns as number);
          } else if (failRuns !== undefined) exportChange.failRuns = failRuns as number;
        }
        if (typeof broadcastDelayMs === 'number') hub.setBroadcastDelay(sandbox, broadcastDelayMs);
        if (typeof dropSockets === 'string') hub.drop(sandbox, dropSockets);
        faults.addHttpRules(sandbox, rules);
        if (Object.keys(exportChange).length) faults.setExportSettings(sandbox, exportChange);
        return { ok: true };
      });
    },
    { prefix: '/__test__/s/:sandbox' },
  );
}
