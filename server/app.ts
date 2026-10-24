import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import { registerBoardRoutes } from './board-routes.ts';
import { createExports } from './exports.ts';
import { createFaults } from './faults.ts';
import { createExtras } from './extras.ts';
import { createFlags } from './flags.ts';
import { CLOSE_UNKNOWN_SANDBOX, createHub } from './hub.ts';
import { createReviews } from './reviews.ts';
import { createContacts } from './contacts.ts';
import { createBookings } from './bookings.ts';
import { createFeed } from './feed.ts';
import { createChecklist } from './checklist.ts';
import { createVaults } from './vault.ts';
import { createBios } from './bio.ts';
import { registerSearch } from './search.ts';
import { registerInvoices } from './invoices.ts';
import { createFeedback } from './feedback.ts';
import { createInvites } from './invites.ts';
import { createReleases } from './releases.ts';
import { createShop } from './shop.ts';
import { openStore } from './store.ts';
import { registerTestHooks } from './test-hooks.ts';
import { messageInput } from './validation.ts';
import { createInbox } from './inbox.ts';
import { createOrders } from './orders.ts';
import { createFiles } from './files.ts';
import { createSms } from './sms.ts';
import { createShipping } from './shipping.ts';
import { registerPhotos } from './photos.ts';
import { createAccounts } from './account.ts';
import { createTeams } from './team.ts';
import { createMeetings } from './meetings.ts';
import { createOtps } from './otp.ts';
import { createPasskeys } from './passkeys.ts';
import { createDeliveries } from './delivery.ts';
import { createImports } from './imports.ts';
import { createUploads } from './uploads.ts';
import { createTickets } from './tickets.ts';
import { createAppearances } from './appearance.ts';
import { registerStatements } from './statements.ts';
import { createPriceAlerts } from './priceAlerts.ts';
import { createScores } from './scores.ts';
import { createPasswords } from './passwords.ts';
import { createSales } from './sales.ts';
import { createArticles } from './articles.ts';
import { createPosts } from './posts.ts';
import { createVoiceNotes } from './voiceNotes.ts';

export type AppOptions = {
  dbPath?: string;
  testHooks?: boolean;
  clientDir?: string;
  sandboxTtlMs?: number;
  heartbeatMs?: number;
};

type Params = { sandbox: string };

export async function buildApp(opts: AppOptions = {}) {
  const store = openStore(opts.dbPath ?? ':memory:');
  const hub = createHub(opts.heartbeatMs);
  const faults = createFaults();
  const flags = createFlags();
  const extras = createExtras(store);
  const exportJobs = createExports(store, faults);
  const shop = createShop();
  const reviews = createReviews();
  const contacts = createContacts();
  const bookings = createBookings();
  const feed = createFeed();
  const checklist = createChecklist();
  const vaults = createVaults();
  const bios = createBios();
  const feedback = createFeedback();
  const invites = createInvites();
  const releases = createReleases();
  const inbox = createInbox();
  const orders = createOrders();
  const files = createFiles();
  const sms = createSms();
  const shipping = createShipping();
  const accounts = createAccounts();
  const teams = createTeams();
  const meetings = createMeetings();
  const otps = createOtps();
  const passkeys = createPasskeys();
  const deliveries = createDeliveries();
  const imports = createImports();
  const uploads = createUploads();
  const tickets = createTickets();
  const appearances = createAppearances();
  const priceAlerts = createPriceAlerts();
  const scores = createScores();
  const passwords = createPasswords();
  const sales = createSales();
  const articles = createArticles();
  const posts = createPosts();
  const voiceNotes = createVoiceNotes();
  const app = Fastify({ trustProxy: true });

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
        if (req.ws) return;
        const path = req.url.split('?')[0]!.replace(`/api/s/${sandbox}`, '');
        const fault = faults.take(sandbox, req.method, path);
        if (!fault) return;
        if (fault.delayMs) await new Promise((r) => setTimeout(r, fault.delayMs));
        if (fault.status) return reply.code(fault.status).send({ error: 'injected fault' });
      });

      scope.get<{ Params: Params }>('/', async (req) => ({ id: req.params.sandbox }));

      registerBoardRoutes(scope, store, exportJobs, flags);
      extras.register(scope);
      shop.register(scope);
      reviews.register(scope);
      contacts.register(scope);
      bookings.register(scope);
      feed.register(scope);
      checklist.register(scope);
      vaults.register(scope);
      bios.register(scope);
      registerSearch(scope);
      registerInvoices(scope);
      feedback.register(scope);
      invites.register(scope);
      releases.register(scope);
      inbox.register(scope);
      orders.register(scope);
      files.register(scope);
      sms.register(scope);
      shipping.register(scope);
      registerPhotos(scope);
      accounts.register(scope);
      teams.register(scope);
      meetings.register(scope);
      otps.register(scope);
      passkeys.register(scope);
      deliveries.register(scope);
      imports.register(scope);
      uploads.register(scope);
      tickets.register(scope);
      appearances.register(scope);
      registerStatements(scope);
      priceAlerts.register(scope);
      scores.register(scope);
      passwords.register(scope);
      sales.register(scope);
      articles.register(scope);
      posts.register(scope);
      voiceNotes.register(scope);

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
            socket.send(JSON.stringify({ type: 'gone' }));
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

  if (opts.testHooks) registerTestHooks(app, { store, hub, faults, exportJobs, flags, extras, shop, reviews, contacts, bookings, feed, checklist, vaults, bios, feedback, invites, releases, inbox, orders, files, sms, shipping, accounts, teams, meetings, otps, passkeys, deliveries, imports, uploads, tickets, appearances, priceAlerts, scores, passwords, sales, articles, posts, voiceNotes });

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
    for (const id of store.pruneOlderThan(Date.now() - ttl)) {
      hub.remove(id);
      faults.clear(id);
      flags.clear(id);
      extras.clear(id);
      shop.clear(id);
      reviews.clear(id);
      contacts.clear(id);
      bookings.clear(id);
      feed.clear(id);
      checklist.clear(id);
      vaults.clear(id);
      bios.clear(id);
      feedback.clear(id);
      invites.clear(id);
      releases.clear(id);
      exportJobs.clear(id);
      inbox.clear(id);
      orders.clear(id);
      files.clear(id);
      sms.clear(id);
      shipping.clear(id);
      accounts.clear(id);
      teams.clear(id);
      meetings.clear(id);
      otps.clear(id);
      passkeys.clear(id);
      deliveries.clear(id);
      imports.clear(id);
      uploads.clear(id);
      tickets.clear(id);
      appearances.clear(id);
      priceAlerts.clear(id);
      scores.clear(id);
      passwords.clear(id);
      sales.clear(id);
      articles.clear(id);
      posts.clear(id);
      voiceNotes.clear(id);
    }
  }, Math.min(ttl, 60 * 60 * 1000));
  pruneTimer.unref();

  app.addHook('preClose', async () => {
    extras.stop();
  });

  app.addHook('onClose', async () => {
    clearInterval(pruneTimer);
    hub.stop();
    exportJobs.stop();
    store.close();
  });

  return app;
}
