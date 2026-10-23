# API

| Endpoint | |
|---|---|
| `GET /api/s/:id/messages?since=N` | `{ messages: [{ seq, name, text }] }` with `seq > N`. |
| `POST /api/s/:id/messages` | `{ name, text }`; name up to 40 characters, text up to 500. |
| `GET /api/s/:id/cards?q=` | `{ cards: [{ id, title, description, status, version, updatedBy, dueDate }] }`; `status` is `todo`, `doing`, or `done`; `q` filters titles. |
| `POST /api/s/:id/cards` | `{ title, description?, status?, dueDate?, by? }`; a duplicate title gets `409` and `{ existing }`. |
| `GET /api/s/:id/flags` | `{ createCard, draw }`: the pinned variant and the fixed draw, each `null` when not set. |
| `GET /api/s/:id/cards/:card` | One card, with `ETag: "<version>"`. |
| `PATCH /api/s/:id/cards/:card` | `{ title?, description?, status?, dueDate?, by? }`. With `If-Match: "<version>"`, an outdated version gets `412` and `{ current }`. |
| `POST /api/s/:id/exports` | Starts an export: `{ id, status, progress, error, retryOf }`. |
| `GET /api/s/:id/exports[/:export]` | All exports (newest first) or one. |
| `POST /api/s/:id/exports/:export/cancel` and `/retry` | Cancel a running export; retry a failed or cancelled one as a new export. |
| `GET /api/s/:id/exports/:export/file` | The CSV, once the export is done. |
| `GET /api/s/:id/activity?from=&limit=` | `{ total, entries: [{ n, text }] }`; `limit` up to 500. |
| `GET` and `PUT /api/s/:id/settings` | `{ displayName, theme, emailDigest }`. |
| `GET` and `PUT /api/s/:id/playlist` | `{ songs: [{ id, title }] }`; `PUT` takes `{ order: [id, ...] }` listing every song once, else `400`. |
| `POST /api/s/:id/card-tokens` | The card form's endpoint: `{ number, expiry, cvc }` as a `text/plain` JSON body; `201` with `{ token, last4 }`, or `400` with `{ field }`. |
| `GET` and `POST /api/s/:id/topups` | `{ balance, topups: [{ amount, last4 }] }`, newest first, amounts in grosze; `POST` takes `{ amount, token }`, uses the token up, and answers `402` for a declined card. |
| `GET` and `PUT /api/s/:id/draft` | `{ text, version }`; `PUT` takes text up to 5000 characters and a version from 1, keeps it only when the version is newer than the stored one, and returns the stored draft. |
| `GET` and `DELETE /api/s/:id/calendar` | `{ connected, email }`; `DELETE` disconnects. |
| `POST /api/s/:id/calendar/authorize` and `/calendar/connect` | The sign-in window gets a one-time `{ code }`; the page sends `{ code }` to `connect`, and a used or unknown code gets `400`. |
| `GET /api/s/:id/contacts` | `{ contacts: [{ name, email }] }`, in import order. |
| `POST /api/s/:id/contacts/import` | A CSV file as a `text/csv` body; returns `{ imported, errors: [{ row, message }] }`, or `400` when the first row is not `name,email`. |
| `GET` and `POST /api/s/:id/bookings` | `{ bookings }`; `POST` takes `{ checkIn, nights, adults, children }` and returns the booking with its `id` and `total` in grosze. |
| `GET` and `POST /api/s/:id/feed` | `GET` returns `{ posts: [{ id, text }], more }`, newest first, 10 at a time: `?before=ID` pages by id, `?offset=N` by position, and `?after=ID` returns every newer post. `POST` takes `{ text }`. |
| `GET` and `POST /api/s/:id/checklist` | `{ items: [{ clientId, text }] }` in the order saved; `POST` takes `{ clientId, text }` and returns the existing item for a known `clientId`. |
| `GET /api/s/:id/vault`, `POST /vault/setup`, `/vault/enable`, `/vault/unlock` | `{ enabled }`; setup returns `{ secret }`; enable and unlock take `{ code }`; unlock returns `{ notes }`. Wrong, used, and locked codes get `401`, `409`, and `429`. |
| `GET` and `POST /api/s/:id/support` | Signed in only (`401` otherwise): `{ tickets: [{ id, text }] }` for your email; `POST` takes `{ text }`. |
| `GET /api/s/:id/notifications?after=N` | `{ unread }`; with `after`, waits up to 20 s for the count to differ from `N`. |
| `POST /api/s/:id/auth/request` | `{ email }`: sends a sign-in link to the sandbox's test inbox. |
| `GET /api/s/:id/auth/me`, `POST /api/s/:id/auth/logout` | The signed-in email (`401` if none); sign out. |
| `GET /api/s/:id/mail[/:message]` | The test inbox, newest first. |
| `GET /api/s/:id/products` | `{ products: [{ sku, name, price }] }`; prices in grosze. |
| `GET /api/s/:id/cart` | `{ lines: [{ sku, name, price, qty, lineTotal }], code, insurance, quote: { subtotal, discount, vat, insurance, total } }`; amounts in grosze. |
| `PUT /api/s/:id/cart/items/:sku` | `{ qty }` from 0 to 99; 0 removes the line. Returns the cart. |
| `PUT /api/s/:id/cart/code` | `{ code }`, or `{ code: null }` to remove it; an unknown code gets `400`. Returns the cart. |
| `PUT /api/s/:id/cart/insurance` | `{ on: true \| false }`. Returns the cart. |
| `POST /api/s/:id/orders` | Places the cart as an order and empties the cart: `{ id, lines, code, quote, placedAt }`; an empty cart gets `400`. |
| `GET /api/s/:id/orders` | `{ orders }`, oldest first. |
| `GET /api/s/:id/orders/:order/split?people=N` | `{ order, total, people, shares }`, larger shares first; `people` from 2 to 8, else `400`; amounts in grosze. |
| `GET /api/s/:id/products/:sku/reviews` | `{ average, count, reviews: [{ id, name, rating, text, createdAt, edited }] }`, newest first; `average` is `null` without reviews. |
| `POST /api/s/:id/products/:sku/reviews` | `{ name, rating, text }`; returns the review and its `editToken`. |
| `PATCH /api/s/:id/products/:sku/reviews/:review` | `{ rating?, text? }` with the header `x-edit-token`; another token gets `403`. |
| `WS /api/s/:id/ws?name=&since=N` | Replays messages with `seq > N`, sends `{ type: "ready" }`, then pushes `{ type: "msg", seq, name, text }`. Also sends `{ type: "ping" }` every 5 s, `{ type: "reset" }` before a reset, and `{ type: "gone" }` for an unknown or expired sandbox. |
