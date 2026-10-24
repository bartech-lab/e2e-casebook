import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Trail map</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 2rem; max-width: 32rem; }
      [role='alert'] { background: #fff4c2; padding: 0.5rem; }
    </style>
  </head>
  <body>
    <h1>Trail map</h1>
    <p id="version"></p>
    <div id="notice" role="alert" hidden>A new version is ready. <button id="reload" type="button">Reload</button></div>
    <button id="check" type="button">Check for updates</button>
    <p id="status" role="status"></p>
    <script src="app.js"></script>
  </body>
</html>
`;

const app = (version: number) => `const VERSION = ${version};
document.getElementById('version').textContent = 'Version ' + VERSION;
const notice = document.getElementById('notice');
const status = document.getElementById('status');
let reloading = false;

navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (reloading) return;
  reloading = true;
  location.reload();
});

function offer(reg) {
  if (reg.waiting && navigator.serviceWorker.controller) notice.hidden = false;
}

navigator.serviceWorker.register('sw.js').then((reg) => {
  offer(reg);
  reg.addEventListener('updatefound', () => {
    const worker = reg.installing;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') offer(reg);
    });
  });
  document.getElementById('check').addEventListener('click', async () => {
    status.textContent = 'Checking…';
    try {
      await reg.update();
      status.textContent = reg.installing || reg.waiting ? '' : 'You have the latest version.';
    } catch {
      status.textContent = 'Could not check for updates.';
    }
  });
  document.getElementById('reload').addEventListener('click', () => reg.waiting?.postMessage('skip-waiting'));
});
`;

const worker = (sandbox: string, version: number) => `const VERSION = ${version};
const PREFIX = 'trail-${sandbox}-';
const CACHE = PREFIX + VERSION;
const SHELL = ['./', './app.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key)))),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith(new URL('./', location).pathname)) return;
  event.respondWith(caches.open(CACHE).then(async (cache) => (await cache.match(event.request, { ignoreSearch: true })) ?? fetch(event.request)));
});
`;

export type TrailMap = ReturnType<typeof createTrailMap>;

export function createTrailMap(hasSandbox: (id: string) => boolean) {
  const versions = new Map<string, number>();
  const version = (sandbox: string) => versions.get(sandbox) ?? 1;

  return {
    serve(root: FastifyInstance) {
      const known = (req: { params: Params }, reply: { code(n: number): { send(b: unknown): unknown } }) => hasSandbox(req.params.sandbox) || (reply.code(404).send({ error: 'unknown sandbox' }), false);
      root.get<{ Params: Params }>('/embed/trail/:sandbox/', async (req, reply) => {
        if (!known(req, reply)) return reply;
        return reply.header('cache-control', 'no-cache').type('text/html').send(html);
      });
      root.get<{ Params: Params }>('/embed/trail/:sandbox/app.js', async (req, reply) => {
        if (!known(req, reply)) return reply;
        return reply.header('cache-control', 'max-age=3600').type('text/javascript').send(app(version(req.params.sandbox)));
      });
      root.get<{ Params: Params }>('/embed/trail/:sandbox/sw.js', async (req, reply) => {
        if (!known(req, reply)) return reply;
        return reply.header('cache-control', 'no-cache').type('text/javascript').send(worker(req.params.sandbox, version(req.params.sandbox)));
      });
    },
    deploy(sandbox: string) {
      versions.set(sandbox, version(sandbox) + 1);
      return { version: version(sandbox) };
    },
    clear(sandbox: string) {
      versions.delete(sandbox);
    },
  };
}
