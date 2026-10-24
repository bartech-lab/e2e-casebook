import type { FastifyInstance, FastifyReply } from 'fastify';

type Params = { sandbox: string };
type Entry = { name: string; message: string; at: string };

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function page(sandbox: string, entries: Entry[], opts: { flash?: boolean; error?: string; name?: string; message?: string }) {
  const action = `/api/s/${escape(sandbox)}/guestbook`;
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Guestbook</title>
<style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem}label{display:block;margin:.5rem 0 .2rem}input,textarea{font:inherit;width:100%;box-sizing:border-box}.flash{background:#e3f4ea;padding:.5rem}.error{color:#a40000}li{margin:.5rem 0}</style></head>
<body>
<h1>Guestbook</h1>
${opts.flash ? '<p class="flash" role="status">Thank you for signing.</p>' : ''}
<form method="post" action="${action}">
${opts.error ? `<p class="error" role="alert">${escape(opts.error)}</p>` : ''}
<label for="name">Your name</label><input id="name" name="name" maxlength="60" value="${escape(opts.name ?? '')}">
<label for="message">Message</label><textarea id="message" name="message" rows="3" maxlength="500">${escape(opts.message ?? '')}</textarea>
<p><button type="submit">Sign the guestbook</button></p>
</form>
<h2>Signed so far</h2>
<ol aria-label="Entries">
${entries.map((e) => `<li><strong>${escape(e.name)}</strong>: ${escape(e.message)}</li>`).join('\n')}
</ol>
</body>
</html>`;
}

export type Guestbook = ReturnType<typeof createGuestbook>;

export function createGuestbook() {
  const books = new Map<string, Entry[]>();
  const of = (sandbox: string) => {
    if (!books.has(sandbox)) books.set(sandbox, []);
    return books.get(sandbox)!;
  };
  const html = (reply: FastifyReply, code: number, body: string) => reply.code(code).header('content-type', 'text/html; charset=utf-8').header('cache-control', 'no-store').send(body);

  return {
    register(scope: FastifyInstance) {
      scope.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string', bodyLimit: 16 * 1024 }, (_req, body, done) =>
        done(null, Object.fromEntries(new URLSearchParams(body as string))),
      );
      scope.get<{ Params: Params }>('/guestbook', async (req, reply) => {
        const flash = /(?:^|;\s*)guestbook_flash=1(?:;|$)/.test(req.headers.cookie ?? '');
        if (flash) reply.header('set-cookie', `guestbook_flash=; Path=/api/s/${req.params.sandbox}/guestbook; Max-Age=0; HttpOnly; SameSite=Lax`);
        return html(reply, 200, page(req.params.sandbox, of(req.params.sandbox), { flash }));
      });
      scope.post<{ Params: Params; Body: { name?: unknown; message?: unknown } }>('/guestbook', async (req, reply) => {
        const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 60) : '';
        const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 500) : '';
        const list = of(req.params.sandbox);
        if (!name || !message)
          return html(reply, 422, page(req.params.sandbox, list, { error: !name ? 'Enter your name.' : 'Enter a message.', name, message }));
        list.unshift({ name, message, at: new Date().toISOString() });
        return reply
          .code(303)
          .header('set-cookie', `guestbook_flash=1; Path=/api/s/${req.params.sandbox}/guestbook; HttpOnly; SameSite=Lax`)
          .header('location', `/api/s/${req.params.sandbox}/guestbook`)
          .send();
      });
    },
    clear(sandbox: string) {
      books.delete(sandbox);
    },
  };
}
