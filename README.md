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

### 21. Your plan

The Plan page shows your Pro plan, 49.00 PLN a month, with the next payment on 1 December 2026.
What the app promises:

- **Cancel plan**, then confirming, stops the payments. You keep Pro until 1 December 2026: the
  page shows "Active until 1 December 2026" and no next payment. **Keep plan** changes nothing.
- **Pause plan**, then confirming, skips the December payment: the next payment is 1 January 2027.
- **Resume plan** undoes a cancel or a pause.
- The page shows the same plan after a reload.

### 22. Playlist

The Playlist page lists five songs in an order you can change. What the app promises:

- Drag a song by its handle. Dropping it on the upper half of another song puts it before that
  song; the lower half puts it after.
- With the keyboard: focus a song's handle, press Space to pick it up, move it with the up and
  down arrow keys, and press Space to drop it. Escape puts it back where it was, also during a drag.
- After a move, the page announces "Moved <song> to position <n> of 5."
- The order is saved: a reload shows the same order.

### 23. Top up

The Top up page adds money to a wallet. The card details go into an embedded card form from a
separate payment provider. What the app promises:

- Choose 10.00, 20.00, or 50.00 PLN and pay with a card. The balance grows by exactly that amount,
  and the Top-ups list shows the amount and the card's last four digits.
- The card form checks the card: a 16-digit number that passes the Luhn check, an expiry date
  (MM/YY) that has not passed, and a 3-digit CVC. A wrong card shows an error in the card form,
  and nothing is charged.
- The test card 4242 4242 4242 4242 is accepted. The test card 4000 0000 0000 0002 is declined: the
  page says "Card declined. You were not charged." and the balance does not change.
- Each card entry pays once.

### 24. Draft

The Draft page holds one letter that saves itself. What the app promises:

- The letter saves 1 second after you stop typing, not before. While it saves, the status says
  "Saving…"; once the server has the latest text, it says "All changes saved".
- If a save fails, the status says "Not saved. Retrying…" and the page tries again every 2
  seconds until a save succeeds.
- A reload shows the latest saved text. A save that finishes late never replaces newer text.

### 25. Calendar

The Calendar page connects a calendar from Example Calendar, a separate sign-in service. What the
app promises:

- **Connect calendar** opens Example Calendar's sign-in window. **Allow** closes the window and the
  page shows "Calendar: connected as calendar@example.test". A reload keeps the connection.
- **Deny**, or closing the window, leaves the calendar not connected, and the page says
  "Calendar not connected."
- The page accepts an answer only from the sign-in window it opened for this attempt.
- **Disconnect** removes the connection, also after a reload.
- Each sign-in connects once: its code cannot be used again.

### 26. Contacts

The Contacts page imports contacts from a CSV file. What the app promises:

- Choose a file, or drop it on the page. The first row must be `name,email`. Each valid row
  after it adds a contact.
- Fields may be quoted. A quoted field may contain commas and doubled quotes (`""` is one `"`).
  Windows and Unix line endings both work.
- A row is skipped when its name is missing, its email is invalid, or the email is already a
  contact or appears earlier in the file. The page lists each skipped row by its number (the
  header is row 1) with the reason, and **Download error report** saves `errors.csv` with the
  columns `row,error`.
- The page says how many contacts it imported, and how many rows have errors.

### 27. Stores

The Stores page finds the three stores nearest to you. What the app promises:

- **Use my location** asks the browser for your position and lists the three nearest stores,
  nearest first, each with its great-circle distance (Earth radius 6371 km) rounded to 0.1 km.
- If you block location access, the page says "Location is off. Choose a city instead." If the
  position does not come within 5 seconds, it says "Could not find you. Choose a city instead."
- Choosing a city lists the three stores nearest to that city's centre, also after you used your
  location.

| Store | Latitude | Longitude |
|---|---|---|
| Warszawa Centrum | 52.2297 | 21.0122 |
| Warszawa Mokotów | 52.1935 | 21.0450 |
| Kraków Rynek | 50.0617 | 19.9373 |
| Gdańsk Główne | 54.3520 | 18.6466 |
| Poznań Stary Rynek | 52.4084 | 16.9342 |

| City centre | Latitude | Longitude |
|---|---|---|
| Gdańsk | 54.3520 | 18.6466 |
| Kraków | 50.0647 | 19.9450 |
| Poznań | 52.4064 | 16.9252 |
| Warszawa | 52.2297 | 21.0122 |
| Wrocław | 51.1079 | 17.0385 |

### 28. Quote

The Quote page multiplies a unit price by a quantity. It speaks the browser's language
(`navigator.language`). What the app promises:

- Type the unit price the way your language writes it: `12,50` in Polish, `12.50` in English.
  Up to 6 digits before the decimal separator and up to 2 after; `12,5` means 12.50 PLN.
- The quantity is a whole number from 1 to 99.
- The total is the exact price times the quantity, formatted as PLN with
  `Intl.NumberFormat` for the browser's language, grouping included.
- A price or quantity the page cannot read shows a hint ("Enter a price like 12,50." in Polish)
  and no total.

### 29. Booking

The Booking page books a room in three steps: Dates, Guests, and Review. What the app promises:

- Each step has its own address: `/s/:id/booking/dates`, `/guests`, and `/review`. **Next** and
  **Back** move between steps, and so do the browser's Back and Forward buttons.
- A step keeps what you entered when you come back to it, also after a reload.
- Opening a step before the earlier steps are complete takes you to the first incomplete step.
- The price is 150.00 PLN per adult and 75.00 PLN per child, per night. Review shows the total.
- **Book** books once and shows "Booking BK-<n> confirmed." After that the wizard starts empty,
  and going back does not show the booked review again.

### 30. Feed

The Feed page lists posts, newest first. It starts with 35 posts, and anyone can add one with
`POST /api/s/:id/feed`. What the app promises:

- The page shows the 10 newest posts. Scrolling to the end loads the next 10, until every post
  is shown; then it says "No more posts."
- Every post appears exactly once, in order, even when new posts arrive while you scroll.
- New posts do not move the list. Within 3 seconds a button says how many arrived ("3 new
  posts"); clicking it puts them at the top.

### 31. Checklist

The Checklist page keeps a list of items and keeps working when the connection drops. What the
app promises:

- A new item appears at once. While the browser is offline, the page says "Offline. Changes will
  sync when you are back online." and new items are marked "(not synced)".
- Unsynced items are kept in the browser. When the connection is back, they are sent in the order
  they were added, and the mark disappears. A send that fails is retried every 2 seconds.
- Every item is saved once, even when a send fails after the server got it: the page retries with
  the same item id, and the server ignores an id it already has.

### 32. Vault

The Vault page keeps notes behind two-step verification with an authenticator app. What the app
promises:

- **Turn on two-step verification** shows a secret key (base32). Codes follow RFC 6238: HMAC-SHA1
  over the key, 30-second steps, 6 digits, leading zeros kept. Entering a current code turns it on.
- To unlock the vault, enter a code. The code for the current step and for the steps just before
  and after it are accepted, each only once ("That code was already used. Wait for a new one.").
- A wrong code says "Wrong code." After 5 wrong codes in a row the vault refuses every code for 1
  minute ("Too many tries. Try again in 1 minute.").

### 33. Basket

The Basket page keeps a basket in the browser, without the server. What the app promises:

- **+** and **−** change a product's quantity; the line "Basket: N items" counts every unit.
- Every tab of the same sandbox in the same browser shares the basket. A change in one tab shows in
  the others within a second, without a reload, and a new tab shows the current basket.
- **Empty basket** empties it in every tab.
- Each sandbox has its own basket.

### 34. Support

The Support page sends a message to support. It needs you to be signed in (case 8). What the app
promises:

- The message you are writing is kept in the browser, also across a reload and a new sign-in, until
  it is sent.
- If your session has expired when you press **Send**, the page says "Your session has expired.
  Sign in again; your message is kept." and nothing is sent.
- After you sign in again, the message is still there, and **Send** sends it once. "Your messages"
  lists what you sent, and the message field is empty again.

### 35. Receipt

The Receipt page shows a shop receipt with an order number and the time it was printed (24-hour
clock). What the app promises about how it looks:

- Item names are on the left and amounts on the right, in a monospace font. A long item name, even
  one long code with no spaces, wraps inside its column instead of running into the amount.
- The total is bold, below a dashed line.
- **Dark mode** shows the receipt as light text on a dark background, readable at WCAG AA contrast
  (4.5:1 or more).

### 36. Sign up

The Sign up page creates an account (nothing is stored). It promises to work for people who use a
keyboard or a screen reader:

- Every field has a visible label, and every control is a real control you can reach with Tab.
- When you submit with mistakes, each mistake is shown under its field, read out with the field,
  and the cursor moves to the first field with a mistake.
- **Account created** opens as a dialog. Tab and Shift+Tab stay inside it, Escape closes it, and
  closing it puts the cursor back on **Create account**.
- Text, error messages included, meets WCAG AA contrast.

### 37. Bio

The Bio page has a small rich-text editor with **Bold** and **Italic** buttons (Ctrl+B and Ctrl+I
work too) and **Save**. The saved bio is shown below as your **Public profile**, which other people
see. What it promises:

- Formatting applies to the text you selected, and the buttons show whether the text at the cursor
  is bold or italic.
- Formatting survives saving and reloading.
- Pasting from another page keeps bold, italic and links.
- The public profile shows only formatting and `http`/`https` links. Scripts, event handlers and
  `javascript:` links are removed, however the bio was sent.

### 38. Search

The Search page finds products as you type. What it promises:

- It searches once you stop typing for 300 ms, not on every key.
- The list always shows the results for the text in the status line, and the status line names
  the text those results are for (for example `3 results for “lamp”`).
- When you change the text, results for older text never replace newer ones, however slowly they
  arrive.
- Any text works, `&` and accents included. An empty box shows nothing.

### 39. Invoices

The Invoices page lists two invoices with a **Download PDF** link each. What it promises:

- The link downloads that row's invoice, named after its number (for example
  `INV-2026-0012.pdf`).
- The PDF shows the number, date, customer, every line, the net amount, VAT at 23% rounded to the
  nearest grosz, and the total, which is net plus VAT.

### 40. Price filter

The Price filter page shows products between a lowest and a highest price, chosen with a slider
that has two handles. What it promises:

- Prices go from 0 to 500 PLN in steps of 10. Dragging a handle picks the step nearest the
  pointer, and dragging past an end stops at 0 or 500.
- With a handle focused, the arrow keys move it by 10, Page Up and Page Down by 100, and Home and
  End jump to the ends.
- The lowest price is never above the highest.
- The list shows every product whose price is in the range, both ends included.
- The range is kept in the address (`?min=100&max=300`), so a copied link opens the same range.

### 41. Reminders

The Reminders page reminds you about something in 1, 5, 15 or 60 minutes. What it promises:

- It asks for permission to show notifications only when you press **Remind me**, never on its
  own.
- When the time comes, a system notification titled "Reminder" shows your text. If notifications
  are blocked, the page shows "Reminder: <your text>" instead.
- A reminder never fires early, and a cancelled reminder never fires.
- Pending reminders survive a reload of the page.

### 42. Address

The Address page edits your street, city and postcode. **Save** keeps them in this browser. What
it promises:

- With unsaved changes, following a link in the app asks **Leave without saving?** **Stay** keeps
  you and your changes on the page; **Leave** goes where the link pointed.
- With unsaved changes, reloading or closing the tab makes the browser ask before leaving.
- With no unsaved changes, nothing asks, including after you save and after you change a field
  back to its saved value.

### 43. Feedback

The Feedback page sends a star rating and an optional comment. The stars are a ready-made
`<rating-stars>` widget from another team, and its inside is closed to the page. What it promises:

- Clicking a star picks that many stars. With the widget focused, the arrow keys move the rating
  by one star, and Home and End pick 1 and 5.
- **Send feedback** without a rating says "Choose a rating." and sends nothing.
- After sending, the page says "Thanks! You rated us N of 5." with the rating the server saved.

### 44. Share

The Share page shows an invite link with **Copy link** and **New link** buttons. What it
promises:

- **Copy link** puts the full link, starting with `http`, on the clipboard and says "Link
  copied."
- **New link** replaces the link; after that, **Copy link** copies the new one.
- If the browser refuses to copy, the page says so, selects the link, and asks you to press
  Ctrl+C. It never says "Link copied." when nothing was copied.

### 45. Updates

The Updates page tells you when a new version of the app has been released while the page was
open. The test hook `POST /__test__/s/:id/release` releases a new version for one sandbox. What it
promises:

- It checks every 30 seconds and whenever the window gets focus. It never shows the notice for the
  version you already run.
- A failed check is not shown and does not stop later checks.
- **Reload** loads the new version. **Later** hides the notice until an even newer version comes
  out.

### 46. Inbox

The Inbox page lists eight messages with a checkbox each. What it promises:

- Shift+click on a checkbox selects (or clears) every message between it and the checkbox you
  clicked before, in either direction, both ends included.
- **Select all** selects every message shown. When only some are selected, it shows a mixed
  state.
- **Unread only** hides read messages. Hidden messages are never archived, even if you selected
  them before hiding them.
- **Archive selected (N)** archives exactly the N messages shown as selected, then clears the
  selection.

### 47. Orders

The Orders page shows orders ten at a time, sorted on the server. The test hook
`POST /__test__/s/:id/order-list` with `{ orders: [{ number, customer, total, date }] }` replaces the
orders of one sandbox (`total` in grosze). What it promises:

- A click on a column heading sorts by that column, smallest first; a second click reverses it.
  Totals sort as amounts and dates as dates. Orders that tie keep order-number order, in both
  directions.
- The sorted column says which way it is sorted (`aria-sort`).
- Sorting again starts from page 1. **Previous** and **Next** stop at the first and last page,
  and every order appears on exactly one page.

### 48. Files

The Files page lists five files. **Delete** hides a file at once and shows "Deleted <name>. Undo".
What it promises:

- For 5 seconds, **Undo** brings the file back in its place, and the file is never deleted.
- After 5 seconds the file is deleted for good.
- Deleting another file finishes the earlier delete at once; only the latest can be undone.
- Leaving the page, by a link or by reloading or closing it, finishes a pending delete at once.

### 49. Tasks

The Tasks page is a small to-do list with keyboard shortcuts. What it promises:

- Ctrl+K, or ⌘K on a Mac, opens **Commands** from anywhere on the page, even while typing.
- In **Commands**, typing filters the list (upper or lower case), the arrow keys move the
  highlight and wrap around at the ends, and Enter runs the highlighted command. Escape closes it
  and puts the cursor back where it was.
- N jumps to **New task**, except while you are typing in a field, where it is just the letter n.

### 50. Itinerary

The Itinerary page shows a three-day trip with a **Print itinerary** button. What it promises:

- **Print itinerary** opens the browser's print dialog.
- On paper, the site navigation and the button are left out. The booking reference, every
  day, and the total are printed.
- Each day starts on a new page.
- Each link prints its address after its text, for example "Hotel website
  (https://hotel-wawel.example/)".

### 51. Verify phone

The Verify phone page texts a code (nothing is really sent). The server allows one code every 30
seconds and answers `429` with `Retry-After` otherwise. The test hook
`POST /__test__/s/:id/sms-clock` with `{ advanceMs }` moves one sandbox's server clock forward.
What it promises:

- After a code is sent, the button counts down "Resend in N s" from 30 and cannot be pressed.
  At 0 it says **Resend code** and works again.
- If the server says to wait, the page counts down exactly as long as `Retry-After` says.
- The countdown continues after a reload.

### 52. Order summary

The Order summary page can be shown in English or Arabic. What it promises:

- In Arabic, the whole page reads right to left (`dir="rtl"`, `lang="ar"` on the page), every
  label is in Arabic, numbers and the date use Arabic-Indic digits, and the arrow on **Pay now**
  points left.
- In Arabic, the buttons line up from the right edge, as the text does.
- The language you chose is kept after a reload. Other pages stay left to right.

### 53. Shipping address

The Shipping address page saves a country and a postcode, and a state for the United States.
What it promises:

- Poland takes postcodes like 80-001. The United States takes ZIP codes like 94105 or
  94105-1234 and needs a state. The United Kingdom takes postcodes like SW1A 1AA, in any case
  and with or without the space, and saves them in capitals with the space.
- A state is only asked for, and only saved, for the United States. Changing the country clears
  the old mistakes.
- The server checks the same rules, whoever sends the address.

### 54. Gallery

The Gallery page shows 24 photos in two columns. What it promises:

- A photo loads only when you scroll near it, and each photo is fetched once.
- Every photo, the last ones included, loads once you scroll to it, and has a description
  ("Photo N of 24 from the trip").
- A photo that fails to load says so and offers **Retry**, which loads it again.

### 55. Holiday request

The Holiday request page picks a first and a last day, on a calendar or in the **From** and
**To** fields. What it promises:

- Days before today cannot be picked. A holiday is at most 14 days, first and last day included.
- The page counts working days: Monday to Friday, without public holidays (6 April and 1 May
  2026), across month ends too.
- On the calendar, the arrow keys move by a day or a week, and Page Up and Page Down by a month,
  keeping the day of the month where it exists. Enter or Space picks the focused day.
- Picking a day before the first day starts again from that day.

### 56. Stay signed in

The Stay signed in page signs in `ann@example.test` with the password `correct horse`. What it promises:

- Without **Remember me for 30 days**, closing the browser signs you out. With it, you stay
  signed in for 30 days, even after the browser is closed.
- Page scripts cannot read the sign-in cookie.
- A wrong password signs nobody in.
- **Sign out** ends the session on the server too: a copy of the old cookie no longer works.

### 57. Podcast

The Podcast page plays a 30-second episode (a quiet tone) with its own controls. What it
promises:

- **Play** starts it and **Pause** stops it. **Skip 15 s** jumps 15 seconds ahead, never past
  the end. **Speed** plays at 1×, 1.5× or 2×.
- The **Position** slider moves 5 seconds with the arrow keys and jumps to the ends with Home
  and End.
- The transcript marks the line being spoken: a line counts from its own start time.
- After a reload, the episode continues where you left it.

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
