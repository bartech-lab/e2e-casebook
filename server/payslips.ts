import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { randomBytes } from 'node:crypto';

type Params = { sandbox: string };
type Payslip = { month: string; net: string };
const USERS: Record<string, string> = { alice: 'Alice Nowak', bob: 'Bob Kowal' };
const PASSWORD = 'payday';
const START: Record<string, Payslip[]> = {
  alice: [
    { month: 'August 2026', net: '6,410.00 PLN' },
    { month: 'September 2026', net: '6,410.00 PLN' },
  ],
  bob: [{ month: 'September 2026', net: '5,120.00 PLN' }],
};

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const page = (title: string, body: string, script = '') => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 2rem; max-width: 32rem; }
      label { display: grid; gap: 0.2rem; margin-bottom: 0.5rem; }
      td, th { padding: 0.3rem 1rem 0.3rem 0; text-align: left; }
    </style>
  </head>
  <body>
${body}${script}
  </body>
</html>
`;

const restore = `
    <script>
      addEventListener('pageshow', (event) => {
        if (event.persisted) location.reload();
      });
    </script>`;

export type Payslips = ReturnType<typeof createPayslips>;

export function createPayslips(hasSandbox: (id: string) => boolean) {
  const sessions = new Map<string, { sandbox: string; user: string }>();
  const slips = new Map<string, Record<string, Payslip[]>>();
  const cookieName = (sandbox: string) => `pay_${sandbox}`;
  const list = (sandbox: string, user: string) => slips.get(sandbox)?.[user] ?? START[user]!;

  function session(req: FastifyRequest<{ Params: Params }>) {
    for (const part of (req.headers.cookie ?? '').split(';')) {
      const [k, v] = part.trim().split('=');
      if (k === cookieName(req.params.sandbox)) {
        const s = sessions.get(v ?? '');
        if (s?.sandbox === req.params.sandbox) return { token: v!, user: s.user };
      }
    }
    return null;
  }

  const html = (reply: FastifyReply, body: string, cache = 'private, no-cache') => reply.header('cache-control', cache).type('text/html').send(body);

  const signIn = (error = '') =>
    page(
      'Sign in to Payslips',
      `    <h1>Sign in to Payslips</h1>
    ${error ? `<p role="alert">${error}</p>` : ''}
    <form method="post" action="sign-in">
      <label>Name <input name="name" autocomplete="username" /></label>
      <label>Password <input name="password" type="password" autocomplete="current-password" /></label>
      <button type="submit">Sign in</button>
    </form>`,
    );

  return {
    serve(root: FastifyInstance) {
      root.register(
        async (scope) => {
          scope.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string', bodyLimit: 4096 }, (_req, body, done) =>
            done(null, Object.fromEntries(new URLSearchParams(body as string))),
          );
          scope.addHook('preHandler', async (req, reply) => {
            if (!hasSandbox((req.params as Params).sandbox)) return reply.code(404).send({ error: 'unknown sandbox' });
          });

          scope.get<{ Params: Params }>('/:sandbox/', async (req, reply) => (session(req) ? reply.redirect('payslips', 303) : html(reply, signIn())));

          scope.post<{ Params: Params; Body: { name?: string; password?: string } }>('/:sandbox/sign-in', async (req, reply) => {
            const name = (req.body?.name ?? '').trim().toLowerCase();
            if (!USERS[name] || req.body?.password !== PASSWORD) return html(reply.code(401), signIn('Wrong name or password.'));
            const old = session(req);
            if (old) sessions.delete(old.token);
            const token = randomBytes(12).toString('hex');
            sessions.set(token, { sandbox: req.params.sandbox, user: name });
            return reply
              .header('set-cookie', `${cookieName(req.params.sandbox)}=${token}; Path=/embed/pay/${req.params.sandbox}/; HttpOnly; SameSite=Lax`)
              .redirect('payslips', 303);
          });

          scope.get<{ Params: Params }>('/:sandbox/payslips', async (req, reply) => {
            const s = session(req);
            if (!s) return reply.header('cache-control', 'no-store').redirect('./', 303);
            const rows = list(req.params.sandbox, s.user)
              .map((p) => `        <tr><td>${escape(p.month)}</td><td>${escape(p.net)}</td></tr>`)
              .join('\n');
            return html(
              reply,
              page(
                'Payslips',
                `    <h1>Payslips</h1>
    <p>Signed in as ${escape(USERS[s.user]!)}</p>
    <table aria-label="Payslips">
      <thead><tr><th>Month</th><th>Net pay</th></tr></thead>
      <tbody>
${rows}
      </tbody>
    </table>
    <form method="post" action="sign-out"><button type="submit">Sign out</button></form>`,
                restore,
              ),
              'private, no-store',
            );
          });

          scope.post<{ Params: Params }>('/:sandbox/sign-out', async (req, reply) => {
            const s = session(req);
            if (s) sessions.delete(s.token);
            return reply
              .header('set-cookie', `${cookieName(req.params.sandbox)}=; Path=/embed/pay/${req.params.sandbox}/; HttpOnly; SameSite=Lax; Max-Age=0`)
              .redirect('signed-out', 303);
          });

          scope.get<{ Params: Params }>('/:sandbox/signed-out', async (_req, reply) =>
            html(reply, page('Signed out', `    <h1>You have signed out</h1>\n    <p><a href="./">Sign in</a></p>`)),
          );
        },
        { prefix: '/embed/pay' },
      );
    },
    add(sandbox: string, user: string, payslip: Payslip) {
      const all = slips.get(sandbox) ?? { alice: [...START.alice!], bob: [...START.bob!] };
      all[user] = [...(all[user] ?? []), payslip];
      slips.set(sandbox, all);
      return { payslips: all[user] };
    },
    clear(sandbox: string) {
      slips.delete(sandbox);
      for (const [token, s] of sessions) if (s.sandbox === sandbox) sessions.delete(token);
    },
  };
}
