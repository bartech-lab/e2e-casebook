# e2e-proving-ground

A small, realistic web app built to be tested end to end. Each case is a feature that is hard to
test well: realtime updates, reconnects, ordering, and more to come. Pick an approach, write the
tests, and find out what your tests would miss.

Bring your own framework: Playwright, Cypress, WebdriverIO, or anything that drives a browser.

**Live demo:** <https://e2e-proving-ground.onrender.com> (free tier: it sleeps after 15 minutes
without traffic, takes about a minute to wake, and starts empty after every wake).

## Cases

### 1. Two-user realtime chat

Open a sandbox, join with a name, and send messages. Every page open in the same sandbox receives
them live over a WebSocket. What the app promises:

- Every user sees every message, once, in the order the server accepted them (`seq`).
- A page that loses its connection reconnects by itself and then shows the messages it missed.
- The connection state is shown on the page in `data-testid="connection"`, with a `data-state`
  attribute of `connecting`, `open`, or `closed`.

## Run it

```sh
docker compose up --build
```

Open <http://localhost:3000> and start a sandbox. A sandbox is a private copy of the app; open its
URL in a second window to be the second user.

## Test hooks

With `TEST_HOOKS=1` (the default in `compose.yaml`) the app mounts a test-only API. Every hook is
scoped to one sandbox, so parallel tests never see each other.

| Endpoint | Effect |
|---|---|
| `POST /api/sandboxes` | Creates a sandbox; returns `{ id }`. Not a hook: visitors use it too. |
| `POST /__test__/s/:id/reset` | Deletes the sandbox's messages and closes its sockets. |
| `POST /__test__/s/:id/seed` | `{ messages: [{ name, text }] }` stores and broadcasts messages. |
| `POST /__test__/s/:id/fault` | `{ dropSockets: "<name>" \| "all" }` closes those sockets with code 4001; `{ broadcastDelayMs }` delays broadcasts. |

With `TEST_HOOKS` unset, every `/__test__` path returns 404.

## API

| Endpoint | |
|---|---|
| `GET /api/s/:id/messages?since=N` | `{ messages: [{ seq, name, text }] }` with `seq > N`. |
| `POST /api/s/:id/messages` | `{ name, text }`; name up to 40 characters, text up to 500. |
| `WS /api/s/:id/ws?name=&since=N` | Replays messages with `seq > N`, sends `{ type: "ready" }`, then pushes `{ type: "msg", seq, name, text }`. Also sends `{ type: "ping" }` every 5 s, `{ type: "reset" }` before a reset, and `{ type: "gone" }` for an unknown or expired sandbox. |

## Stack

Node 24 runs TypeScript directly. Fastify serves the API, the WebSocket, and the React build from
one process; data lives in an in-memory SQLite database, so a restart is a full reset. The client
is React 19 with Vite and TanStack Query.

## Develop

```sh
npm ci
npm run dev:server   # API on :3000 with test hooks
npm run dev:web      # Vite on :5173, proxies /api and /__test__
npm run typecheck
npm run test:unit
```

## License

MIT
