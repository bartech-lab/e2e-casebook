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
import type { Shipping } from './shipping.ts';
import type { Accounts } from './account.ts';
import type { Teams } from './team.ts';
import type { Meetings } from './meetings.ts';
import type { Otps } from './otp.ts';
import type { Passkeys } from './passkeys.ts';
import type { Deliveries } from './delivery.ts';
import type { Imports } from './imports.ts';
import type { Uploads } from './uploads.ts';
import type { Tickets } from './tickets.ts';
import type { Appearances } from './appearance.ts';
import type { PriceAlerts } from './priceAlerts.ts';
import type { Scores } from './scores.ts';
import type { Passwords } from './passwords.ts';
import type { Sales } from './sales.ts';
import type { Articles } from './articles.ts';
import type { Posts } from './posts.ts';
import type { VoiceNotes } from './voiceNotes.ts';
import type { PriceList } from './priceList.ts';
import type { NotesSchema } from './notesSchema.ts';
import type { GigTickets } from './gigTickets.ts';
import type { Albums } from './albums.ts';
import type { ReaderAuth } from './readerAuth.ts';
import type { BusTimes } from './busTimes.ts';
import type { Workspaces } from './workspaces.ts';
import type { SavedSearches } from './savedSearches.ts';
import type { EventFeedback } from './eventFeedback.ts';
import type { ExpenseClaims } from './expenseClaims.ts';
import type { CardPayments } from './cardPayments.ts';
import type { Assistant } from './assistant.ts';
import type { Guestbook } from './guestbook.ts';
import type { ClientErrors } from './clientErrors.ts';
import type { ClubActivity } from './clubActivity.ts';
import type { NoticeBoard } from './noticeBoard.ts';
import type { CloudPix } from './cloudPix.ts';
import type { StudyGroup } from './studyGroup.ts';
import type { Billing } from './billing.ts';
import type { Flights } from './flights.ts';
import type { Transfers } from './transfers.ts';
import type { LibraryCards } from './libraryCards.ts';
import type { Rsvps } from './rsvp.ts';
import { DEFAULT_CARDS, type Store } from './store.ts';
import { cardInput, messageInput } from './validation.ts';

type Params = { sandbox: string };
type Deps = { store: Store; hub: Hub; faults: Faults; exportJobs: Exports; flags: Flags; extras: Extras; shop: Shop; reviews: Reviews; contacts: Contacts; bookings: Bookings; feed: Feed; checklist: Checklist; vaults: Vaults; bios: Bios; feedback: FeedbackStore; invites: Invites; releases: Releases; inbox: Inbox; orders: Orders; files: Files; sms: Sms; shipping: Shipping; accounts: Accounts; teams: Teams; meetings: Meetings; otps: Otps; passkeys: Passkeys; deliveries: Deliveries; imports: Imports; uploads: Uploads; tickets: Tickets; appearances: Appearances; priceAlerts: PriceAlerts; scores: Scores; passwords: Passwords; sales: Sales; articles: Articles; posts: Posts; voiceNotes: VoiceNotes; priceList: PriceList; notesSchema: NotesSchema; gigTickets: GigTickets; albums: Albums; readerAuth: ReaderAuth; busTimes: BusTimes; workspaces: Workspaces; savedSearches: SavedSearches; eventFeedback: EventFeedback; expenseClaims: ExpenseClaims; cardPayments: CardPayments; assistant: Assistant; guestbook: Guestbook; clientErrors: ClientErrors; clubActivity: ClubActivity; noticeBoard: NoticeBoard; cloudPix: CloudPix; studyGroup: StudyGroup; billing: Billing; flights: Flights; transfers: Transfers; libraryCards: LibraryCards; rsvps: Rsvps };

type FaultBody = {
  dropSockets?: unknown;
  broadcastDelayMs?: unknown;
  http?: unknown;
  exports?: { stepMs?: unknown; failAtStep?: unknown; failRuns?: unknown };
  auth?: { tokenTtlMs?: unknown };
};

export function registerTestHooks(app: FastifyInstance, { store, hub, faults, exportJobs, flags, extras, shop, reviews, contacts, bookings, feed, checklist, vaults, bios, feedback, invites, releases, inbox, orders, files, sms, shipping, accounts, teams, meetings, otps, passkeys, deliveries, imports, uploads, tickets, appearances, priceAlerts, scores, passwords, sales, articles, posts, voiceNotes, priceList, notesSchema, gigTickets, albums, readerAuth, busTimes, workspaces, savedSearches, eventFeedback, expenseClaims, cardPayments, assistant, guestbook, clientErrors, clubActivity, noticeBoard, cloudPix, studyGroup, billing, flights, transfers, libraryCards, rsvps }: Deps) {
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
        shipping.clear(sandbox);
        accounts.clear(sandbox);
        teams.clear(sandbox);
        meetings.clear(sandbox);
        otps.clear(sandbox);
        passkeys.clear(sandbox);
        deliveries.clear(sandbox);
        imports.clear(sandbox);
        uploads.clear(sandbox);
        tickets.clear(sandbox);
        appearances.clear(sandbox);
        priceAlerts.clear(sandbox);
        scores.clear(sandbox);
        passwords.clear(sandbox);
        sales.clear(sandbox);
        articles.clear(sandbox);
        posts.clear(sandbox);
        voiceNotes.clear(sandbox);
        priceList.clear(sandbox);
        notesSchema.clear(sandbox);
        gigTickets.clear(sandbox);
        albums.clear(sandbox);
        readerAuth.clear(sandbox);
        busTimes.clear(sandbox);
        workspaces.clear(sandbox);
        savedSearches.clear(sandbox);
        eventFeedback.clear(sandbox);
        expenseClaims.clear(sandbox);
        cardPayments.clear(sandbox);
        assistant.clear(sandbox);
        guestbook.clear(sandbox);
        clientErrors.clear(sandbox);
        clubActivity.clear(sandbox);
        noticeBoard.clear(sandbox);
        cloudPix.clear(sandbox);
        studyGroup.clear(sandbox);
        billing.clear(sandbox);
        flights.clear(sandbox);
        transfers.clear(sandbox);
        libraryCards.clear(sandbox);
        rsvps.clear(sandbox);
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

      scope.post<{ Params: Params }>('/team-role', async (req, reply) => {
        const { user, role } = (req.body ?? {}) as { user?: unknown; role?: unknown };
        if (typeof user !== 'string' || (role !== 'viewer' && role !== 'editor' && role !== 'admin')) return reply.code(400).send({ error: 'user and role are required' });
        teams.setRole(req.params.sandbox, user, role);
        return { ok: true };
      });

      scope.get<{ Params: Params }>('/otp', async (req) => ({ code: otps.code(req.params.sandbox) }));

      scope.post<{ Params: Params }>('/upload-pace', async (req, reply) => {
        const rate = (req.body as { bytesPerSecond?: unknown } | undefined)?.bytesPerSecond;
        if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0) return reply.code(400).send({ error: 'bytesPerSecond must be 0 or more' });
        uploads.setPace(req.params.sandbox, rate);
        return { ok: true };
      });

      scope.post<{ Params: Params }>('/price', async (req, reply) => {
        const price = (req.body as { price?: unknown } | undefined)?.price;
        if (typeof price !== 'number' || !Number.isInteger(price) || price < 0) return reply.code(400).send({ error: 'price must be a whole number of grosze, 0 or more' });
        return priceAlerts.setPrice(req.params.sandbox, price);
      });

      scope.post<{ Params: Params }>('/goal', async (req, reply) => {
        const team = (req.body as { team?: unknown } | undefined)?.team;
        if (team !== 'home' && team !== 'away') return reply.code(400).send({ error: 'team must be home or away' });
        return scores.goal(req.params.sandbox, team);
      });

      scope.get<{ Params: Params }>('/score-reads', async (req) => scores.reads(req.params.sandbox));

      scope.post<{ Params: Params }>('/sale', async (req, reply) => {
        const endsInMs = (req.body as { endsInMs?: unknown } | undefined)?.endsInMs;
        if (typeof endsInMs !== 'number' || !Number.isFinite(endsInMs)) return reply.code(400).send({ error: 'endsInMs must be a number' });
        return sales.endIn(req.params.sandbox, endsInMs);
      });

      scope.post<{ Params: Params }>('/price-list', async (req, reply) => {
        const { sku, price } = (req.body ?? {}) as { sku?: unknown; price?: unknown };
        if (typeof sku !== 'string' || typeof price !== 'number' || !Number.isInteger(price) || price < 0) {
          return reply.code(400).send({ error: 'sku must be a string and price a whole number of grosze' });
        }
        return priceList.setPrice(req.params.sandbox, sku, price) ?? reply.code(404).send({ error: 'No such product' });
      });

      scope.get<{ Params: Params }>('/price-list-requests', async (req) => priceList.requests(req.params.sandbox));

      scope.post<{ Params: Params }>('/notes-schema', async (req, reply) => {
        const version = (req.body as { version?: unknown } | undefined)?.version;
        if (version !== 1 && version !== 2) return reply.code(400).send({ error: 'version must be 1 or 2' });
        return notesSchema.setVersion(req.params.sandbox, version);
      });

      scope.post<{ Params: Params }>('/import-mode', async (req) => {
        imports.setManual(req.params.sandbox, (req.body as { manual?: unknown } | undefined)?.manual === true);
        return { ok: true };
      });

      scope.post<{ Params: Params }>('/import-step', async (req, reply) => {
        const rows = (req.body as { rows?: unknown } | undefined)?.rows;
        if (typeof rows !== 'number' || !Number.isInteger(rows) || rows < 1) return reply.code(400).send({ error: 'rows must be a positive integer' });
        imports.step(req.params.sandbox, rows);
        return { ok: true };
      });

      scope.post<{ Params: Params }>('/import-drop', async (req) => ({ dropped: imports.drop(req.params.sandbox) }));

      scope.post<{ Params: Params }>('/gig-stock', async (req, reply) => {
        const left = (req.body as { left?: unknown } | undefined)?.left;
        if (typeof left !== 'number' || !Number.isInteger(left) || left < 0) return reply.code(400).send({ error: 'left must be a whole number, 0 or more' });
        return gigTickets.setLeft(req.params.sandbox, left);
      });

      scope.post<{ Params: Params }>('/reader-expire', async (req) => readerAuth.expireAll(req.params.sandbox));

      scope.post<{ Params: Params }>('/bus', async (req, reply) => {
        const departures = (req.body as { departures?: unknown } | undefined)?.departures;
        const valid = Array.isArray(departures) && departures.every((d) => typeof d?.line === 'string' && typeof d?.to === 'string' && typeof d?.time === 'string');
        if (!valid) return reply.code(400).send({ error: 'departures must be [{ line, to, time }]' });
        return busTimes.setDepartures(req.params.sandbox, departures);
      });

      scope.post<{ Params: Params }>('/bus-fail', async (req, reply) => {
        const times = (req.body as { times?: unknown } | undefined)?.times;
        if (typeof times !== 'number' || !Number.isInteger(times) || times < 0) return reply.code(400).send({ error: 'times must be a whole number' });
        return busTimes.failNext(req.params.sandbox, times);
      });

      scope.post<{ Params: Params }>('/workspace', async (req, reply) => {
        const { setupDone, delayMs } = (req.body ?? {}) as { setupDone?: unknown; delayMs?: unknown };
        if (setupDone !== undefined && typeof setupDone !== 'boolean') return reply.code(400).send({ error: 'setupDone must be true or false' });
        if (delayMs !== undefined && (typeof delayMs !== 'number' || !Number.isInteger(delayMs) || delayMs < 0 || delayMs > 10000)) return reply.code(400).send({ error: 'delayMs must be 0 to 10000' });
        return workspaces.set(req.params.sandbox, { ...(setupDone === undefined ? {} : { setupDone }), ...(delayMs === undefined ? {} : { delayMs }) });
      });

      scope.post<{ Params: Params }>('/saved-searches', async (req, reply) => {
        const { names, delayMs } = (req.body ?? {}) as { names?: unknown; delayMs?: unknown };
        if (names !== undefined && !(Array.isArray(names) && names.every((n) => typeof n === 'string'))) return reply.code(400).send({ error: 'names must be strings' });
        if (delayMs !== undefined && (typeof delayMs !== 'number' || !Number.isInteger(delayMs) || delayMs < 0 || delayMs > 10000)) return reply.code(400).send({ error: 'delayMs must be 0 to 10000' });
        if (Array.isArray(names)) savedSearches.seed(req.params.sandbox, names as string[]);
        if (typeof delayMs === 'number') savedSearches.setDelay(req.params.sandbox, delayMs);
        return { ok: true };
      });

      scope.post<{ Params: Params }>('/claims-expire', async (req) => expenseClaims.expireAll(req.params.sandbox));

      scope.post<{ Params: Params }>('/assistant-pace', async (req, reply) => {
        const ms = (req.body as { ms?: unknown } | undefined)?.ms;
        if (typeof ms !== 'number' || !Number.isInteger(ms) || ms < 0 || ms > 2000) return reply.code(400).send({ error: 'ms must be a whole number from 0 to 2000' });
        assistant.setPace(req.params.sandbox, ms);
        return { ok: true };
      });

      scope.post<{ Params: Params }>('/club-activity', async (req, reply) => {
        const events = (req.body as { events?: unknown } | undefined)?.events;
        if (!clubActivity.seed(req.params.sandbox, events)) return reply.code(400).send({ error: 'events must be a list of { text, at } with ISO dates' });
        return { ok: true };
      });

      scope.get<{ Params: Params }>('/notice-reads', async (req) => ({ reads: noticeBoard.reads(req.params.sandbox) }));

      scope.get<{ Params: Params }>('/cloudpix-exchanges', async (req) => ({ exchanges: cloudPix.exchanges(req.params.sandbox) }));

      scope.get<{ Params: Params }>('/typing-signals', async (req) => ({ signals: studyGroup.signals(req.params.sandbox) }));

      scope.post<{ Params: Params }>('/flight-pace', async (req, reply) => {
        if (!flights.setPace(req.params.sandbox, (req.body as { ms?: unknown } | undefined)?.ms)) return reply.code(400).send({ error: 'ms must be 0 to 120000' });
        return { ok: true };
      });
      scope.get<{ Params: Params }>('/flight-requests', async (req) => flights.stats(req.params.sandbox));

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
