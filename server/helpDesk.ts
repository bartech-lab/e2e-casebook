import type { FastifyInstance } from 'fastify';
import { randomBytes } from 'node:crypto';

type Params = { sandbox: string };

const widget = `(() => {
  const nonce = document.currentScript.nonce;
  const style = document.createElement('style');
  style.nonce = nonce;
  style.textContent = '.help-panel { position: fixed; right: 1rem; bottom: 1rem; width: 18rem; padding: 1rem; background: #fff; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 4px 16px #0003; } .help-panel ol { padding-left: 1.2rem; }';
  document.head.append(style);
  const opener = document.getElementById('chat');
  const panel = document.createElement('section');
  panel.className = 'help-panel';
  panel.setAttribute('aria-label', 'Chat with us');
  panel.innerHTML = '<h2>Chat with us</h2><ol aria-label="Conversation"></ol><form><label>Your question <input name="q" autocomplete="off"></label> <button type="submit">Send</button></form><button type="button" class="close">Close</button>';
  const log = panel.querySelector('ol');
  const form = panel.querySelector('form');
  const input = form.elements.q;
  const close = () => {
    panel.hidden = true;
    opener.setAttribute('aria-expanded', 'false');
    opener.focus();
  };
  panel.querySelector('.close').addEventListener('click', close);
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  const say = (text) => {
    const li = document.createElement('li');
    li.textContent = text;
    log.append(li);
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    say(question);
    input.value = '';
    const res = await fetch('questions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question }) });
    say((await res.json()).answer);
  });
  document.body.append(panel);
  window.openHelp = () => {
    panel.hidden = false;
    opener.setAttribute('aria-expanded', 'true');
    input.focus();
  };
})();
`;

const page = (nonce: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Help desk</title>
    <style nonce="${nonce}">
      body { font-family: system-ui, sans-serif; margin: 2rem; max-width: 32rem; }
    </style>
  </head>
  <body>
    <h1>Help desk</h1>
    <p>Most answers are in the help centre. Still stuck? Ask us.</p>
    <button id="chat" type="button" aria-expanded="false">Chat with us</button>
    <script nonce="${nonce}">
      const nonce = document.currentScript.nonce;
      document.getElementById('chat').addEventListener('click', () => {
        if (window.openHelp) return window.openHelp();
        if (document.getElementById('help-widget')) return;
        const s = document.createElement('script');
        s.id = 'help-widget';
        s.src = 'widget.js';
        s.nonce = nonce;
        s.onload = () => window.openHelp();
        document.body.append(s);
      });
    </script>
  </body>
</html>
`;

export type HelpDesk = ReturnType<typeof createHelpDesk>;

export function createHelpDesk(hasSandbox: (id: string) => boolean) {
  const reports = new Map<string, unknown[]>();

  return {
    serve(root: FastifyInstance) {
      root.register(
        async (scope) => {
          scope.addContentTypeParser(['application/csp-report', 'application/reports+json'], { parseAs: 'string', bodyLimit: 16384 }, (_req, body, done) => {
            try {
              done(null, JSON.parse(body as string));
            } catch {
              done(null, {});
            }
          });
          scope.addHook('preHandler', async (req, reply) => {
            if (!hasSandbox((req.params as Params).sandbox)) return reply.code(404).send({ error: 'unknown sandbox' });
          });
          scope.get<{ Params: Params }>('/:sandbox/', async (req, reply) => {
            const nonce = randomBytes(16).toString('base64');
            return reply
              .header('cache-control', 'no-store')
              .header('content-security-policy', `default-src 'self'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; report-uri /embed/help/${req.params.sandbox}/csp-report`)
              .type('text/html')
              .send(page(nonce));
          });
          scope.get<{ Params: Params }>('/:sandbox/widget.js', async (_req, reply) => reply.header('cache-control', 'no-store').type('text/javascript').send(widget));
          scope.post<{ Params: Params; Body: { question?: unknown } }>('/:sandbox/questions', async (req, reply) => {
            if (typeof req.body?.question !== 'string' || !req.body.question.trim()) return reply.code(400).send({ error: 'question is required' });
            return { answer: 'Thanks, we will reply by email.' };
          });
          scope.post<{ Params: Params }>('/:sandbox/csp-report', async (req, reply) => {
            reports.set(req.params.sandbox, [...(reports.get(req.params.sandbox) ?? []), req.body]);
            return reply.code(204).send();
          });
        },
        { prefix: '/embed/help' },
      );
    },
    reports(sandbox: string) {
      return reports.get(sandbox) ?? [];
    },
    clear(sandbox: string) {
      reports.delete(sandbox);
    },
  };
}
