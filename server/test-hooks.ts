import type { FastifyInstance } from 'fastify';
import type { Exports } from './exports.ts';
import { parseHttpRules, type Faults } from './faults.ts';
import type { Extras } from './extras.ts';
import { CREATE_CARD_VARIANTS, type Flags } from './flags.ts';
import type { Reviews } from './reviews.ts';
import type { Contacts } from './contacts.ts';
import type { Bookings } from './bookings.ts';
import type { Feed } from './feed.ts';
import type { Checklist } from './checklist.ts';
import type { Vaults } from './vault.ts';
import type { Bios } from './bio.ts';
import type { FeedbackStore } from './feedback.ts';
import type { Invites } from './invites.ts';
import type { Releases } from './releases.ts';
import type { Shop } from './shop.ts';
import type { Hub } from './hub.ts';
import type { Inbox } from './inbox.ts';
import type { Orders } from './orders.ts';
import type { Files } from './files.ts';
import type { Sms } from './sms.ts';
import { DEFAULT_CARDS, type Store } from './store.ts';
import { cardInput, messageInput } from './validation.ts';

type Params = { sandbox: string };
type Deps = { store: Store; hub: Hub; faults: Faults; exportJobs: Exports; flags: Flags; extras: Extras; shop: Shop; reviews: Reviews; contacts: Contacts; bookings: Bookings; feed: Feed; checklist: Checklist; vaults: Vaults; bios: Bios; feedback: FeedbackStore; invites: Invites; releases: Releases; inbox: Inbox; orders: Orders; files: Files; sms: Sms };

type FaultBody = {
  dropSockets?: unknown;
  broadcastDelayMs?: unknown;
  http?: unknown;
  exports?: { stepMs?: unknown; failAtStep?: unknown; failRuns?: unknown };
  auth?: { tokenTtlMs?: unknown };
};

export function registerTestHooks(app: FastifyInstance, { store, hub, faults, exportJobs, flags, extras, shop, reviews, contacts, bookings, feed, checklist, vaults, bios, feedback, invites, releases, inbox, orders, files, sms }: Deps) {
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
        flags.clear(sandbox);
        extras.clear(sandbox);
        shop.clear(sandbox);
        reviews.clear(sandbox);
        contacts.clear(sandbox);
        bookings.clear(sandbox);
        feed.clear(sandbox);
        checklist.clear(sandbox);
        vaults.clear(sandbox);
        bios.clear(sandbox);
        feedback.clear(sandbox);
        invites.clear(sandbox);
        releases.clear(sandbox);
        inbox.clear(sandbox);
        orders.clear(sandbox);
        files.clear(sandbox);
        sms.clear(sandbox);
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

      scope.post<{ Params: Params; Body: { email?: unknown } }>('/login', async (req, reply) => {
        const email = req.body?.email;
        if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
          return reply.code(400).send({ error: 'invalid email' });
        }
        const normalized = email.trim().toLowerCase();
        const value = extras.startSession(reply, req.params.sandbox, normalized);
        return { email: normalized, cookie: { name: `epg_session_${req.params.sandbox}`, value } };
      });

      scope.post<{ Params: Params; Body: { createCard?: unknown; draw?: unknown } }>('/flags', async (req, reply) => {
        const body = req.body ?? {};
        const keys = (['createCard', 'draw'] as const).filter((k) => k in body);
        if (!keys.length) return reply.code(400).send({ error: 'send createCard, draw, or both' });
        for (const k of keys) {
          if (body[k] !== null && !CREATE_CARD_VARIANTS.includes(body[k] as never)) {
            return reply.code(400).send({ error: `${k} must be inline, dialog, or null` });
          }
        }
        flags.set(req.params.sandbox, Object.fromEntries(keys.map((k) => [k, body[k]])));
        return flags.get(req.params.sandbox);
      });

      scope.post<{ Params: Params }>('/release', async (req) => ({ version: releases.release(req.params.sandbox) }));

      scope.post<{ Params: Params }>('/order-list', async (req, reply) => {
        const { orders: list } = (req.body ?? {}) as { orders?: unknown };
        const valid = (o: unknown) => {
          const r = o as Record<string, unknown>;
          return Number.isInteger(r.number) && typeof r.customer === 'string' && Number.isInteger(r.total) && typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date as string);
        };
        if (!Array.isArray(list) || !list.every(valid)) return reply.code(400).send({ error: 'orders must be { number, customer, total, date }[]' });
        orders.seed(req.params.sandbox, list);
        return { ok: true };
      });

      scope.post<{ Params: Params }>('/sms-clock', async (req, reply) => {
        const advanceMs = (req.body as { advanceMs?: unknown } | undefined)?.advanceMs;
        if (typeof advanceMs !== 'number' || !Number.isFinite(advanceMs) || advanceMs < 0) return reply.code(400).send({ error: 'advanceMs must be a number of ms, 0 or more' });
        sms.advance(req.params.sandbox, advanceMs);
        return { ok: true };
      });

      scope.post<{ Params: Params }>('/expire-sessions', async (req) => {
        extras.expireSessions(req.params.sandbox);
        return { ok: true };
      });

      scope.post<{ Params: Params; Body: { nowMs?: unknown } }>('/clock', async (req, reply) => {
        const nowMs = req.body?.nowMs;
        if (nowMs !== null && (typeof nowMs !== 'number' || !Number.isFinite(nowMs) || nowMs < 0)) return reply.code(400).send({ error: 'nowMs must be a time in ms or null' });
        vaults.setClock(req.params.sandbox, nowMs);
        return { ok: true };
      });

      scope.get<{ Params: Params }>('/vault-code', async (req, reply) => {
        const code = vaults.currentCode(req.params.sandbox);
        return code ? { code } : reply.code(404).send({ error: 'no vault setup' });
      });

      scope.post<{ Params: Params; Body: FaultBody }>('/fault', async (req, reply) => {
        const { sandbox } = req.params;
        const { dropSockets, broadcastDelayMs, http, exports, auth } = req.body ?? {};
        const ttl = auth?.tokenTtlMs;
        if (auth !== undefined && (typeof ttl !== 'number' || ttl < 0 || ttl > 3_600_000)) {
          return reply.code(400).send({ error: 'invalid auth.tokenTtlMs' });
        }
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
        if (typeof ttl === 'number') extras.setTokenTtl(sandbox, ttl);
        if (Object.keys(exportChange).length) faults.setExportSettings(sandbox, exportChange);
        return { ok: true };
      });
    },
    { prefix: '/__test__/s/:sandbox' },
  );
}
