import { randomBytes } from 'node:crypto';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Store } from './store.ts';

type Params = { sandbox: string };

export type Settings = { displayName: string; theme: 'light' | 'dark'; emailDigest: boolean };
const DEFAULT_SETTINGS: Settings = { displayName: '', theme: 'light', emailDigest: false };

export const ACTIVITY_TOTAL = 10_000;
const ACTORS = ['alice', 'bob', 'carol', 'dave', 'erin'];
const VERBS = ['created', 'moved', 'renamed', 'commented on', 'archived', 'reopened', 'assigned'];

export function activityEntry(n: number) {
  return { n, text: `${ACTORS[n % ACTORS.length]} ${VERBS[n % VERBS.length]} card #${((n * 37) % 997) + 1}` };
}

type Mail = { id: number; to: string; subject: string; text: string; link: string; receivedAt: string };
type Token = { email: string; expires: number; used: boolean };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const sessionCookie = (sandbox: string) => `epg_session_${sandbox}`;

function readCookie(req: FastifyRequest, name: string) {
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

export type Extras = ReturnType<typeof createExtras>;

export function createExtras(store: Store) {
  let closing = false;
  const settings = new Map<string, Settings>();
  const mail = new Map<string, Mail[]>();
  const tokens = new Map<string, Map<string, Token>>();
  const sessions = new Map<string, Map<string, string>>();
  const tokenTtl = new Map<string, number>();

  const inner = <V>(m: Map<string, Map<string, V>>, sandbox: string) => {
    let v = m.get(sandbox);
    if (!v) m.set(sandbox, (v = new Map()));
    return v;
  };

  function startSession(reply: FastifyReply, sandbox: string, email: string) {
    const sid = randomBytes(18).toString('base64url');
    inner(sessions, sandbox).set(sid, email);
    reply.header('set-cookie', `${sessionCookie(sandbox)}=${sid}; Path=/; HttpOnly; SameSite=Lax`);
    return sid;
  }

  function sessionEmail(req: FastifyRequest, sandbox: string) {
    const sid = readCookie(req, sessionCookie(sandbox));
    return sid ? sessions.get(sandbox)?.get(sid) : undefined;
  }

  function register(scope: FastifyInstance) {
    scope.get<{ Params: Params }>('/settings', async (req) => settings.get(req.params.sandbox) ?? DEFAULT_SETTINGS);

    scope.put<{ Params: Params }>('/settings', async (req, reply) => {
      const { displayName, theme, emailDigest } = (req.body ?? {}) as Record<string, unknown>;
      if (
        typeof displayName !== 'string' ||
        displayName.trim().length > 40 ||
        (theme !== 'light' && theme !== 'dark') ||
        typeof emailDigest !== 'boolean'
      ) {
        return reply.code(400).send({ error: 'invalid settings' });
      }
      const saved: Settings = { displayName: displayName.trim(), theme, emailDigest };
      settings.set(req.params.sandbox, saved);
      return saved;
    });

    scope.get<{ Params: Params; Querystring: { after?: string; waitMs?: string } }>('/notifications', async (req) => {
      const count = () => store.messagesSince(req.params.sandbox, 0).length;
      const after = req.query.after === undefined ? undefined : Number(req.query.after);
      const waitMs = Math.min(Math.max(Number(req.query.waitMs ?? 20_000) || 0, 0), 25_000);
      const deadline = Date.now() + waitMs;
      while (after !== undefined && count() === after && Date.now() < deadline && !closing) {
        await new Promise((r) => setTimeout(r, 250));
      }
      return { unread: count() };
    });

    scope.get<{ Params: Params; Querystring: { from?: string; limit?: string } }>('/activity', async (req, reply) => {
      const from = req.query.from === undefined ? 1 : Number(req.query.from);
      const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
      if (!Number.isInteger(from) || from < 1 || !Number.isInteger(limit) || limit < 1 || limit > 500) {
        return reply.code(400).send({ error: 'from must be >= 1 and limit 1..500' });
      }
      const entries = [];
      for (let n = from; n < from + limit && n <= ACTIVITY_TOTAL; n++) entries.push(activityEntry(n));
      return { total: ACTIVITY_TOTAL, entries };
    });

    scope.post<{ Params: Params }>('/auth/request', async (req, reply) => {
      const { sandbox } = req.params;
      const email = (req.body as { email?: unknown } | undefined)?.email;
      if (typeof email !== 'string' || email.length > 254 || !EMAIL.test(email.trim())) {
        return reply.code(400).send({ error: 'invalid email' });
      }
      const to = email.trim().toLowerCase();
      const token = randomBytes(18).toString('base64url');
      inner(tokens, sandbox).set(token, { email: to, expires: Date.now() + (tokenTtl.get(sandbox) ?? 10 * 60_000), used: false });
      const link = `${req.protocol}://${req.host}/api/s/${sandbox}/auth/verify?token=${token}`;
      const box = mail.get(sandbox) ?? [];
      box.push({
        id: box.length + 1,
        to,
        subject: 'Your sign-in link',
        text: `Hi,\n\nUse this link to sign in. It works once and expires in 10 minutes:\n${link}\n`,
        link,
        receivedAt: new Date().toISOString(),
      });
      mail.set(sandbox, box);
      return reply.code(202).send({ ok: true });
    });

    scope.get<{ Params: Params; Querystring: { token?: string } }>('/auth/verify', async (req, reply) => {
      const { sandbox } = req.params;
      const entry = req.query.token ? tokens.get(sandbox)?.get(req.query.token) : undefined;
      if (!entry || entry.used || entry.expires < Date.now()) {
        return reply.redirect(`/s/${sandbox}/account?error=invalid-link`);
      }
      entry.used = true;
      startSession(reply, sandbox, entry.email);
      return reply.redirect(`/s/${sandbox}/account`);
    });

    scope.get<{ Params: Params }>('/auth/me', async (req, reply) => {
      const email = sessionEmail(req, req.params.sandbox);
      return email ? { email } : reply.code(401).send({ error: 'not signed in' });
    });

    scope.post<{ Params: Params }>('/auth/logout', async (req, reply) => {
      const sid = readCookie(req, sessionCookie(req.params.sandbox));
      if (sid) sessions.get(req.params.sandbox)?.delete(sid);
      return reply
        .header('set-cookie', `${sessionCookie(req.params.sandbox)}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
        .send({ ok: true });
    });

    scope.get<{ Params: Params }>('/mail', async (req) => ({ messages: [...(mail.get(req.params.sandbox) ?? [])].reverse() }));

    scope.get<{ Params: Params & { id: string } }>('/mail/:id', async (req, reply) => {
      const m = mail.get(req.params.sandbox)?.find((x) => x.id === Number(req.params.id));
      return m ?? reply.code(404).send({ error: 'unknown message' });
    });
  }

  return {
    register,
    startSession,
    setTokenTtl: (sandbox: string, ms: number) => tokenTtl.set(sandbox, ms),
    stop() {
      closing = true;
    },
    clear(sandbox: string) {
      settings.delete(sandbox);
      mail.delete(sandbox);
      tokens.delete(sandbox);
      sessions.delete(sandbox);
      tokenTtl.delete(sandbox);
    },
  };
}
