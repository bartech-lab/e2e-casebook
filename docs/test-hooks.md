# Test hooks

With `TEST_HOOKS=1` (the default in `compose.yaml`) the app mounts a test-only API. Every hook is
scoped to one sandbox, so parallel tests never see each other.

| Endpoint | Effect |
|---|---|
| `POST /api/sandboxes` | Creates a sandbox; returns `{ id }`. Not a hook: visitors use it too. |
| `POST /__test__/s/:id/reset` | Deletes messages, restores the four default cards, removes export jobs, clears faults, flags, settings, the playlist order, the wallet and card tokens, the draft, the calendar connection, the contacts, the bookings, the feed, the checklist, the vault and its clock, support messages, mail, sessions, the cart, and orders, restores the default reviews, and closes the sandbox's sockets. |
| `POST /__test__/s/:id/seed` | `{ messages: [{ name, text }] }` stores and broadcasts messages; `{ cards: [{ title, description?, status? }] }` replaces all cards. |
| `POST /__test__/s/:id/fault` | See below. |
| `POST /__test__/s/:id/flags` | `{ createCard: "inline" \| "dialog" \| null }` pins the create-card variant for the sandbox. `{ draw: "inline" \| "dialog" \| null }` fixes the variant a visitor without a stored assignment is assigned; `null` draws at random. Send either key or both; a key you leave out keeps its value. |
| `POST /__test__/s/:id/clock` | `{ nowMs }` sets the sandbox's server time for the Vault (codes and lockout); `{ nowMs: null }` returns to the real time. |
| `GET /__test__/s/:id/vault-code` | `{ code }`: the Vault's code for the sandbox's current server time. |
| `POST /__test__/s/:id/expire-sessions` | Marks every session of the sandbox as expired on the server; the cookies stay in the browser. |
| `POST /__test__/s/:id/login` | `{ email }` signs in without mail; returns the session cookie `{ name, value }` and sets it. |

`fault` accepts any of:

| Field | Effect |
|---|---|
| `dropSockets: "<name>" \| "all"` | Closes those sockets with code 4001. |
| `broadcastDelayMs` | Delays chat broadcasts. |
| `http: [{ method, path, status?, delayMs?, times?, always? }]` | Later API requests matching `method` and `path` (relative to `/api/s/:id`, `*` matches one segment, e.g. `cards/*`) wait `delayMs` and, with `status`, fail with that status without running. Each rule applies `times` times (default 1), or forever with `always: true`. |
| `exports: { stepMs?, failAtStep?, failRuns? }` | Export step length (default 500 ms), and the step at which the next `failRuns` exports (default 1) fail. |
| `auth: { tokenTtlMs }` | Lifetime of sign-in links requested afterwards (default 10 minutes). |

With `TEST_HOOKS` unset, every `/__test__` path returns 404.
