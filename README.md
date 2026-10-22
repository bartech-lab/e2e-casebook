# e2e-casebook

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

### 5. Feature flag

New cards are created with one of two variants: an inline form or a dialog. A visitor is assigned
one at random and keeps it; a sandbox can pin one for everybody. What the app promises:

- Both variants create the card in To do.
- A visitor sees the same variant on every visit, and a pinned variant wins over the assignment.

### 6. Due dates, time zones, and DST

Cards can have a due date. The board shows Overdue, Due today, Due tomorrow, or Due in N days.
What the app promises:

- "Today" is the visitor's local calendar day, whatever the time zone.
- The count is in calendar days, also across a daylight-saving change.
- An open board updates when midnight passes.

### 7. A shared environment

Card titles are unique within a sandbox, and the board shows how many cards it has. Many test
runs may use one sandbox at the same time, the way teams share a staging environment. What the
app promises:

- Two cards can never have the same title, whatever the case or surrounding spaces.
- Search and the count reflect everything in the sandbox, including other people's cards.

### 8. Magic-link sign-in

The Account page signs you in with a link sent by email. Mail never leaves the app: every sandbox
has a test inbox on the Mail page and at `GET /api/s/:id/mail`. What the app promises:

- The link signs you in once; a used or expired link does not, and says so.
- A session belongs to one sandbox, and Sign out ends it.

### 9. A virtualized list

The Activity page lists 10,000 entries, rendering only the rows in view and loading them in pages.
What the app promises:

- Every entry from 1 to 10,000 appears once, in order, with no gaps at page boundaries.
- Go to entry shows the requested entry.

### 10. A toast and a page that is never idle

Saving Settings shows "Settings saved" for 2 seconds. Every sandbox page keeps a long-polling
request open for notifications. What the app promises:

- The toast appears only after the server has stored the settings, never when the save fails.
- The toast disappears after 2 seconds.

### 11. Checkout total

The Shop page sells three products. Prices are in PLN. What the app promises:

- The code `SAVE10` takes 10.00 PLN off the subtotal, but never takes it below zero. Codes ignore
  letter case and surrounding spaces.
- VAT is 23% of the subtotal after the discount, rounded half up to the grosz (0.01 PLN).
- The total is the subtotal minus the discount, plus VAT. A placed order charges exactly the total
  shown in the summary.

### 12. Shipping insurance

Checkout offers shipping insurance for 4.99 PLN, with no VAT on it. What the app promises:

- Insurance is added only when the customer opts in.
- The summary lists every charge, and the total includes each one.
- A placed order charges exactly the total shown in the summary.

### 13. Product reviews

Each product has a reviews page, linked from the Shop. What the app promises:

- A review needs a rating from 1 to 5 and 1 to 500 characters of text; surrounding spaces do not
  count.
- The average rating is the mean of the product's ratings, rounded half up to one decimal.
- Reviews are listed newest first. Review text is shown exactly as written, never as HTML.

### 14. Editing a review

The browser that posted a review can edit it. What the app promises:

- You can change the rating and the text of your own review. Nobody else can edit it.
- An edited review shows "(edited)", and the average rating uses the new rating.

### 15. Splitting an order

Under your orders, "Split order" opens a page that divides the order total between 2 and 8 people.
What the app promises:

- Every share is a whole number of grosze, and the shares add up to exactly the order total.
- Shares differ by at most 0.01 PLN, and the larger shares come first.
- Changing the number of people updates the shares.

### 16. The People picker

The split page chooses the number of people with a list built from ARIA roles, not a native
select. What the app promises:

- A click on the People button opens the list. With the button focused, Enter, Space, or the Down
  arrow opens it too.
- In the open list, Up and Down move the highlight. Enter or a click chooses an option and closes
  the list.
- Escape closes the list without changing the number.

### 17. Cookie consent

The Deals page asks for cookie consent before it shows deals picked for you. The banner is a
self-contained web component, like the consent widgets shops embed from a vendor. What the app
promises:

- Until you choose, the banner is shown and the deals picked for you are off.
- **Accept all** closes the banner and shows the deals picked for you. **Only necessary** closes
  the banner and keeps them off.
- This browser remembers the choice: after a reload the banner stays closed and the deals stay as
  chosen.
- **Cookie settings** opens the banner again, and a new choice replaces the old one, after a
  reload too.

### 18. Gift cards

The Gift cards page sells gift cards. What the app promises:

- Pick an amount of 50, 100, or 200 PLN, or a custom amount from 20 to 500 PLN, grosze included.
  Outside that range the page asks for a valid amount and shows no summary.
- Choose 1 to 10 cards. Card value is the amount times the number of cards.
- Gift wrap costs 5.00 PLN per card. From 5 cards, wrapping is free.
- The summary shows the card value, the wrapping, and the total, which is the two added together.

### 19. Notes

The Notes page lists notes you can star, archive, or delete. What the app promises:

- Tick notes to select them. **Star** stars each selected note, or takes its star away.
- **Archive** moves the selected notes from Notes to Archive. **Delete** removes them.
- Actions that do not fit in the toolbar are under **More**. Choosing one closes the menu.
- After any action, no note is selected.

### 20. Budget

The Budget page keeps a list of expenses and charts them. What the app promises:

- Add an expense with a category (Food, Transport, or Fun) and an amount from 0.01 to 10000 PLN,
  grosze included. It appears in the Expenses list.
- The chart shows one bar per category, labelled with that category's total. A category with no
  expenses shows 0.00 PLN.
- **Show data** shows the chart's numbers as a table.
- Removing an expense takes it out of the list and out of the chart.

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
| `POST /__test__/s/:id/reset` | Deletes messages, restores the four default cards, removes export jobs, clears faults, flags, settings, mail, sessions, the cart, and orders, restores the default reviews, and closes the sandbox's sockets. |
| `POST /__test__/s/:id/seed` | `{ messages: [{ name, text }] }` stores and broadcasts messages; `{ cards: [{ title, description?, status? }] }` replaces all cards. |
| `POST /__test__/s/:id/fault` | See below. |
| `POST /__test__/s/:id/flags` | `{ createCard: "inline" \| "dialog" \| null }` pins the create-card variant for the sandbox. `{ draw: "inline" \| "dialog" \| null }` fixes the variant a visitor without a stored assignment is assigned; `null` draws at random. Send either key or both; a key you leave out keeps its value. |
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

## API

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
