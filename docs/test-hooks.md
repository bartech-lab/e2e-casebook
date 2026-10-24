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


## Hooks for one case

Each of these serves one case; the case file says how its tests use it. Paths are relative to `/__test__/s/:id`.

| Hook | Body | Effect | Case |
|---|---|---|---|
| `POST /release` |  | Releases a new app version for the sandbox; returns `{ version }`. | [45](../cases/45-updates.md) |
| `POST /order-list` | `{ orders: [{ number, customer, total, date }] }` | Replaces the sandbox's orders (`total` in grosze). | [47](../cases/47-orders.md) |
| `POST /sms-clock` | `{ advanceMs }` | Moves the sandbox's server clock for texted codes forward. | [51](../cases/51-verify-phone.md) |
| `POST /team-role` | `{ user, role }` | Sets a team member's role (`viewer`, `editor` or `admin`) on the server, as if someone else had changed it. | [60](../cases/60-team.md) |
| `GET /otp` |  | `{ code }`: the code most recently sent for the sandbox, or `null`. | [63](../cases/63-confirm-email.md) |
| `POST /import-mode` | `{ manual: true \| false }` | With `manual: true`, imports started afterwards do not advance on their own; `import-step` moves them. | [67](../cases/67-import.md) |
| `POST /import-step` | `{ rows }` | Processes the next `rows` rows of the running import, sending their events. | [67](../cases/67-import.md) |
| `POST /import-drop` |  | Closes every open event stream of the running import (the import itself goes on); returns `{ dropped }`, how many were closed. | [67](../cases/67-import.md) |
| `POST /upload-pace` | `{ bytesPerSecond }` | Limits how fast the server reads uploads; `0` removes the limit. | [72](../cases/72-upload.md) |
| `POST /price` | `{ price }` | Changes the product's price (grosze). | [80](../cases/80-price-alerts.md) |
| `POST /goal` | `{ team: "home" \| "away" }` | Scores a goal. | [81](../cases/81-live-score.md) |
| `GET /score-reads` |  | How often the score was read. | [81](../cases/81-live-score.md) |
| `POST /sale` | `{ endsInMs }` | Moves the end of the sale. | [84](../cases/84-flash-sale.md) |
| `POST /price-list` | `{ sku, price }` | Changes one price (grosze). | [90](../cases/90-price-list.md) |
| `GET /price-list-requests` |  | The price-list requests the server got, with the status it answered and the `If-None-Match` it received. | [90](../cases/90-price-list.md) |
| `POST /notes-schema` | `{ version: 1 \| 2 }` | Releases that version of the notes schema. | [95](../cases/95-local-notes.md) |
| `POST /gig-stock` | `{ left }` | Sets how many tickets are left. | [104](../cases/104-concert-tickets.md) |
| `POST /reader-expire` |  | Ends every reading-list session of the sandbox on the server. | [110](../cases/110-reading-list.md) |
| `POST /bus` | `{ departures: [{ line, to, time }] }` | Replaces the departures. | [111](../cases/111-bus-stop.md) |
| `POST /bus-fail` | `{ times }` | The next `times` requests for departures fail. | [111](../cases/111-bus-stop.md) |
| `POST /workspace` | `{ setupDone?, delayMs? }` | Whether setup is finished, and how long the settings take to load. | [112](../cases/112-workspace.md) |
| `POST /saved-searches` | `{ names?, delayMs? }` | Sets the saved searches, and how long the list takes to load. | [113](../cases/113-saved-searches.md) |
| `POST /claims-expire` |  | Ends every expense-claims session of the sandbox on the server. | [119](../cases/119-expense-claims.md) |
| `POST /assistant-pace` | `{ ms }` | Time between words of an answer (120 ms by default, up to 2000). | [124](../cases/124-assistant.md) |
| `POST /club-activity` | `{ events: [{ text, at }] }` | Replaces the events (`at` is an ISO date). | [134](../cases/134-club-activity.md) |
| `GET /notice-reads` |  | `{ reads }`: how many times each notice was sent as read. | [135](../cases/135-notice-board.md) |
| `GET /cloudpix-exchanges` |  | `{ exchanges }`: how many sign-in codes were traded. | [136](../cases/136-prints.md) |
| `GET /typing-signals` |  | `{ signals }`: how many "I am typing" signals the server received. | [137](../cases/137-study-group.md) |
| `POST /flight-pace` | `{ ms }` | How long the server waits before answering a search (up to 120000). | [139](../cases/139-flight-search.md) |
| `GET /flight-requests` |  | `{ started, completed, aborted }` search requests. | [139](../cases/139-flight-search.md) |
| `POST /song-pace` | `{ ms: [n, ...] }` | Delays for successive saves, used in turn. | [144](../cases/144-radio-favourites.md) |
| `POST /song-fail` | `{ times }` | The next `times` saves fail. | [144](../cases/144-radio-favourites.md) |
| `GET /song-writes` |  | The saves in the order the server applied them. | [144](../cases/144-radio-favourites.md) |
| `POST /barber-clock` | `{ advanceMs }` | Moves the shop's clock forward. | [148](../cases/148-barber.md) |
| `POST /staff-pace` | `{ ms: [n, ...] }` | Delays for successive details requests, used in turn. | [151](../cases/151-staff.md) |
| `GET /staff-writes` |  | The saves the server received. | [151](../cases/151-staff.md) |

With `TEST_HOOKS` unset, every `/__test__` path returns 404.
