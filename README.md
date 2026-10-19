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

### 2. Concurrent edit

Two people open the same card on the board and both edit it. What the app promises:

- A save based on an outdated version never overwrites the newer one silently.
- The second person sees who changed the card and what they wrote, and chooses: **Use theirs**
  loads the newer version into the form; **Keep mine** saves their own text on top of it.

### 3. Optimistic moves

Cards move between columns at once, before the server answers. What the app promises:

- A move the server rejects is undone, with one error message.
- Undoing one failed move never undoes a different move that succeeded, including a later move
  of the same card.
- Once nothing is pending, the board shows what the server has.

### 4. Export job

**Export board as CSV** starts a background job with progress. What the app promises:

- Progress goes from 0 to 100 and then the CSV can be downloaded, not before.
- A running export can be cancelled and then stops where it was.
- A failed or cancelled export can be retried; the retry is a new export and the old one stays as
  it was.
- The page updates while an export runs and stops checking when none does.

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
| `POST /__test__/s/:id/reset` | Deletes messages, restores the four default cards, removes export jobs, clears all faults, and closes the sandbox's sockets. |
| `POST /__test__/s/:id/seed` | `{ messages: [{ name, text }] }` stores and broadcasts messages; `{ cards: [{ title, description?, status? }] }` replaces all cards. |
| `POST /__test__/s/:id/fault` | See below. |

`fault` accepts any of:

| Field | Effect |
|---|---|
| `dropSockets: "<name>" \| "all"` | Closes those sockets with code 4001. |
| `broadcastDelayMs` | Delays chat broadcasts. |
| `http: [{ method, path, status?, delayMs?, times?, always? }]` | Later API requests matching `method` and `path` (relative to `/api/s/:id`, `*` matches one segment, e.g. `cards/*`) wait `delayMs` and, with `status`, fail with that status without running. Each rule applies `times` times (default 1), or forever with `always: true`. |
| `exports: { stepMs?, failAtStep?, failRuns? }` | Export step length (default 500 ms), and the step at which the next `failRuns` exports (default 1) fail. |

With `TEST_HOOKS` unset, every `/__test__` path returns 404.

## API

| Endpoint | |
|---|---|
| `GET /api/s/:id/messages?since=N` | `{ messages: [{ seq, name, text }] }` with `seq > N`. |
| `POST /api/s/:id/messages` | `{ name, text }`; name up to 40 characters, text up to 500. |
| `GET /api/s/:id/cards` | `{ cards: [{ id, title, description, status, version, updatedBy }] }`; `status` is `todo`, `doing`, or `done`. |
| `GET /api/s/:id/cards/:card` | One card, with `ETag: "<version>"`. |
| `PATCH /api/s/:id/cards/:card` | `{ title?, description?, status?, by? }`. With `If-Match: "<version>"`, an outdated version gets `412` and `{ current }`. |
| `POST /api/s/:id/exports` | Starts an export: `{ id, status, progress, error, retryOf }`. |
| `GET /api/s/:id/exports[/:export]` | All exports (newest first) or one. |
| `POST /api/s/:id/exports/:export/cancel` and `/retry` | Cancel a running export; retry a failed or cancelled one as a new export. |
| `GET /api/s/:id/exports/:export/file` | The CSV, once the export is done. |
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
