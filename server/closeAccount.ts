import type { FastifyInstance, FastifyReply } from 'fastify';

type Params = { sandbox: string };

const page = (title: string, body: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 1.5rem; max-width: 32rem; }
      label { display: grid; gap: 0.2rem; margin-bottom: 0.5rem; }
    </style>
  </head>
  <body>
${body}
  </body>
</html>
`;

export type CloseAccount = ReturnType<typeof createCloseAccount>;

export function createCloseAccount(hasSandbox: (id: string) => boolean) {
  const closed = new Set<string>();

  const send = (reply: FastifyReply, body: string) =>
    reply
      .header('content-security-policy', "frame-ancestors 'self'")
      .header('x-frame-options', 'SAMEORIGIN')
      .header('cache-control', 'no-store')
      .type('text/html')
      .send(body);

  const confirm = (error = '') =>
    page(
      'Confirm closing your account',
      `    <h1>Confirm closing your account</h1>
    ${error ? `<p role="alert">${error}</p>` : ''}
    <form method="post" action="close">
      <label>Type CLOSE to confirm <input name="confirm" autocomplete="off" /></label>
      <button type="submit">Close my account</button>
    </form>
    <p><a href="./">Keep my account</a></p>`,
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

          scope.get<{ Params: Params }>('/:sandbox/', async (req, reply) =>
            send(
              reply,
              closed.has(req.params.sandbox)
                ? page('Account closed', '    <h1>Your account is closed.</h1>')
                : page(
                    'Close your account',
                    `    <h1>Close your account</h1>
    <p>Closing your account deletes your orders and saved addresses. This cannot be undone.</p>
    <form method="get" action="confirm"><button type="submit">Continue</button></form>`,
                  ),
            ),
          );

          scope.get<{ Params: Params }>('/:sandbox/confirm', async (_req, reply) => send(reply, confirm()));

          scope.post<{ Params: Params; Body: { confirm?: string } }>('/:sandbox/close', async (req, reply) => {
            if (req.body?.confirm !== 'CLOSE') return send(reply.code(400), confirm('Type CLOSE in capitals to confirm.'));
            closed.add(req.params.sandbox);
            return reply.redirect('./', 303);
          });
        },
        { prefix: '/embed/account' },
      );
    },
    isClosed(sandbox: string) {
      return closed.has(sandbox);
    },
    clear(sandbox: string) {
      closed.delete(sandbox);
    },
  };
}
