# e2e-casebook

A small, realistic web app built to be tested end to end. Each case is a feature that is hard to
test well, with a list of requirements. Write automated tests that check every requirement. Each
case hides a detail that makes the obvious test miss a broken requirement.

Bring your own framework: Playwright, Cypress, WebdriverIO, or anything that drives a browser.

**Live demo:** <https://e2e-proving-ground.onrender.com> (free tier: it sleeps after 15 minutes
without traffic, takes about a minute to wake, and starts empty after every wake).

## Cases

| # | Case | What it is |
|---|---|---|
| 1 | [Two-user realtime chat](cases/01-two-user-realtime-chat.md) | Open a sandbox, join with a name, and send messages. |
| 2 | [Concurrent edit](cases/02-concurrent-edit.md) | Two people open the same card on the board and both edit it. |
| 3 | [Optimistic moves](cases/03-optimistic-moves.md) | Cards move between columns at once, before the server answers. |
| 4 | [Export job](cases/04-export-job.md) | **Export board as CSV** starts a background job with progress. |
| 5 | [Feature flag](cases/05-feature-flag.md) | New cards are created with one of two variants: an inline form or a dialog. |
| 6 | [Due dates, time zones, and DST](cases/06-due-dates-time-zones-and-dst.md) | Cards can have a due date. |
| 7 | [A shared environment](cases/07-a-shared-environment.md) | Card titles are unique within a sandbox, and the board shows how many cards it has. |
| 8 | [Magic-link sign-in](cases/08-magic-link-sign-in.md) | The Account page signs you in with a link sent by email. |
| 9 | [A virtualized list](cases/09-a-virtualized-list.md) | The Activity page lists 10,000 entries, rendering only the rows in view and loading them in pages. |
| 10 | [A toast and a page that is never idle](cases/10-a-toast-and-a-page-that-is-never-idle.md) | Saving Settings shows "Settings saved" for 2 seconds. |
| 11 | [Checkout total](cases/11-checkout-total.md) | The Shop page sells three products. |
| 12 | [Shipping insurance](cases/12-shipping-insurance.md) | Checkout offers shipping insurance for 4.99 PLN, with no VAT on it. |
| 13 | [Product reviews](cases/13-product-reviews.md) | Each product has a reviews page, linked from the Shop. |
| 14 | [Editing a review](cases/14-editing-a-review.md) | The browser that posted a review can edit it. |
| 15 | [Splitting an order](cases/15-splitting-an-order.md) | Under your orders, "Split order" opens a page that divides the order total between 2 and 8 people. |
| 16 | [The People picker](cases/16-the-people-picker.md) | The split page chooses the number of people with a list built from ARIA roles, not a native select. |
| 17 | [Cookie consent](cases/17-cookie-consent.md) | The Deals page asks for cookie consent before it shows deals picked for you. |
| 18 | [Gift cards](cases/18-gift-cards.md) | The Gift cards page sells gift cards. |
| 19 | [Notes](cases/19-notes.md) | The Notes page lists notes you can star, archive, or delete. |
| 20 | [Budget](cases/20-budget.md) | The Budget page keeps a list of expenses and charts them. |
| 21 | [Your plan](cases/21-your-plan.md) | The Plan page shows your Pro plan, 49.00 PLN a month, with the next payment on 1 December 2026. |
| 22 | [Playlist](cases/22-playlist.md) | The Playlist page lists five songs in an order you can change. |
| 23 | [Top up](cases/23-top-up.md) | The Top up page adds money to a wallet. |
| 24 | [Draft](cases/24-draft.md) | The Draft page holds one letter that saves itself. |
| 25 | [Calendar](cases/25-calendar.md) | The Calendar page connects a calendar from Example Calendar, a separate sign-in service. |
| 26 | [Contacts](cases/26-contacts.md) | The Contacts page imports contacts from a CSV file. |
| 27 | [Stores](cases/27-stores.md) | The Stores page finds the three stores nearest to you. |
| 28 | [Quote](cases/28-quote.md) | The Quote page multiplies a unit price by a quantity. |
| 29 | [Booking](cases/29-booking.md) | The Booking page books a room in three steps: Dates, Guests, and Review. |
| 30 | [Feed](cases/30-feed.md) | The Feed page lists posts, newest first. |
| 31 | [Checklist](cases/31-checklist.md) | The Checklist page keeps a list of items and keeps working when the connection drops. |
| 32 | [Vault](cases/32-vault.md) | The Vault page keeps notes behind two-step verification with an authenticator app. |
| 33 | [Basket](cases/33-basket.md) | The Basket page keeps a basket in the browser, without the server. |
| 34 | [Support](cases/34-support.md) | The Support page sends a message to support. |
| 35 | [Receipt](cases/35-receipt.md) | The Receipt page shows a shop receipt with an order number and the time it was printed (24-hour clock).. |
| 36 | [Sign up](cases/36-sign-up.md) | The Sign up page creates an account (nothing is stored). |
| 37 | [Bio](cases/37-bio.md) | The Bio page has a small rich-text editor with **Bold** and **Italic** buttons (Ctrl+B and Ctrl+I work too) and **Save**. |
| 38 | [Search](cases/38-search.md) | The Search page finds products as you type. |
| 39 | [Invoices](cases/39-invoices.md) | The Invoices page lists two invoices with a **Download PDF** link each. |
| 40 | [Price filter](cases/40-price-filter.md) | The Price filter page shows products between a lowest and a highest price, chosen with a slider that has two handles. |
| 41 | [Reminders](cases/41-reminders.md) | The Reminders page reminds you about something in 1, 5, 15 or 60 minutes. |
| 42 | [Address](cases/42-address.md) | The Address page edits your street, city and postcode. |
| 43 | [Feedback](cases/43-feedback.md) | The Feedback page sends a star rating and an optional comment. |
| 44 | [Share](cases/44-share.md) | The Share page shows an invite link with **Copy link** and **New link** buttons. |
| 45 | [Updates](cases/45-updates.md) | The Updates page tells you when a new version of the app has been released while the page was open. |
| 46 | [Inbox](cases/46-inbox.md) | The Inbox page lists eight messages with a checkbox each. |
| 47 | [Orders](cases/47-orders.md) | The Orders page shows orders ten at a time, sorted on the server. |
| 48 | [Files](cases/48-files.md) | The Files page lists five files. |
| 49 | [Tasks](cases/49-tasks.md) | The Tasks page is a small to-do list with keyboard shortcuts. |
| 50 | [Itinerary](cases/50-itinerary.md) | The Itinerary page shows a three-day trip with a **Print itinerary** button. |
| 51 | [Verify phone](cases/51-verify-phone.md) | The Verify phone page texts a code (nothing is really sent). |
| 52 | [Order summary](cases/52-order-summary.md) | The Order summary page can be shown in English or Arabic. |
| 53 | [Shipping address](cases/53-shipping-address.md) | The Shipping address page saves a country and a postcode, and a state for the United States. |
| 54 | [Gallery](cases/54-gallery.md) | The Gallery page shows 24 photos in two columns. |
| 55 | [Holiday request](cases/55-holiday-request.md) | The Holiday request page picks a first and a last day, on a calendar or in the **From** and **To** fields. |
| 56 | [Stay signed in](cases/56-stay-signed-in.md) | The Stay signed in page signs in `ann@example.test` with the password `correct horse`. |
| 57 | [Podcast](cases/57-podcast.md) | The Podcast page plays a 30-second episode (a quiet tone) with its own controls. |
| 58 | [Bakery](cases/58-bakery.md) | The Bakery page has a site header with four links. |
| 59 | [Session](cases/59-session.md) | The Session page signs you out after 90 seconds without activity. |
| 60 | [Team](cases/60-team.md) | The Team page shows a Roadmap document and its members. |
| 61 | [Meetings](cases/61-meetings.md) | The Meetings page adds a meeting at a date and time, once or every week for 4 weeks. |
| 62 | [Directory](cases/62-directory.md) | The Directory page lists 10,000 customers. |
| 63 | [Confirm email](cases/63-confirm-email.md) | The Confirm email page asks for a 6-digit code, one box per digit. |
| 64 | [Messages](cases/64-messages.md) | The Messages page counts new messages in English or Polish. |
| 65 | [Passkeys](cases/65-passkeys.md) | The Passkeys page creates passkeys for ann and signs in with them. |
| 66 | [Delivery](cases/66-delivery.md) | The Delivery page asks you to sign for a parcel. |
| 67 | [Import](cases/67-import.md) | The Import page imports 100 customers and shows the progress as it happens. |
| 68 | [Packing list](cases/68-packing-list.md) | The Packing list page edits a list of things to pack. |
| 69 | [Help centre](cases/69-help-centre.md) | The Help centre opens articles without reloading the page. |
| 70 | [Order review](cases/70-order-review.md) | The Order review page lists 12 items under a header that stays at the top, with a pay bar that stays at the bottom. |
| 71 | [Sales report](cases/71-sales-report.md) | The Sales report page adds up 20,000,000 sales by region. |
| 72 | [Upload](cases/72-upload.md) | The Upload page sends a file of up to 20 MB to the server. |
| 73 | [Support ticket](cases/73-support-ticket.md) | The Support ticket page takes a description and pasted screenshots. |
| 74 | [Timesheet](cases/74-timesheet.md) | The Timesheet page is a grid of hours per day and project. |
| 75 | [Shop reviews](cases/75-shop-reviews.md) | The Shop reviews page shows a reviews widget in a sandboxed frame. |
| 76 | [Country](cases/76-country.md) | The Country page is a list of 30 countries you can pick from with the keyboard. |
| 77 | [Appearance](cases/77-appearance.md) | The Appearance page lets you pick a theme and how much motion you see. |
| 78 | [Statement](cases/78-statement.md) | The Statement page lists a month of transactions and downloads them as a CSV file. |
| 79 | [Plans](cases/79-plans.md) | The Plans page compares three plans, each with an info button that shows a tooltip. |
| 80 | [Price alerts](cases/80-price-alerts.md) | The Price alerts page sends a browser notification when a product gets cheaper. |
| 81 | [Live score](cases/81-live-score.md) | The Live score page follows a match and stops asking the server while the tab is hidden. |
| 82 | [Mobile inbox](cases/82-mobile-inbox.md) | The Mobile inbox page deletes a message when you swipe it to the left, with an undo. |
| 83 | [Change password](cases/83-change-password.md) | The Change password page changes the account password and works with password managers. |
| 84 | [Flash sale](cases/84-flash-sale.md) | The Flash sale page counts down to the end of a sale by the shop's clock. |
| 85 | [Class list](cases/85-class-list.md) | The Class list page sorts and searches 15 pupils with Polish names. |
| 86 | [Newsletter](cases/86-newsletter.md) | The Newsletter page marks an article as read once it has been on screen for 2 seconds. |
| 87 | [Post editor](cases/87-post-editor.md) | The Post editor page writes and publishes a blog post in a panel that scrolls. |
| 88 | [Announcements](cases/88-announcements.md) | The Announcements page shows three banners you can dismiss. |
| 89 | [Voice note](cases/89-voice-note.md) | The Voice note page records a voice note with the microphone and saves it. |
| 90 | [Price list](cases/90-price-list.md) | The Price list page checks for new prices and downloads the list only when it changed. |
| 91 | [Contributors](cases/91-contributors.md) | The Contributors page shows names on small cards, cutting the ones that do not fit. |
| 92 | [Product details](cases/92-product-details.md) | The Product details page shows four tabs of details about a hand grinder. |
| 93 | [Files tree](cases/93-files-tree.md) | The Files tree page shows folders and files in a tree you can open and close. |
| 94 | [Promotions](cases/94-promotions.md) | The Promotions page shows a carousel of four offers that changes every 5 seconds. |
| 95 | [Local notes](cases/95-local-notes.md) | The Local notes page keeps notes in the browser's database and updates it safely across tabs. |
| 96 | [Letter](cases/96-letter.md) | The Letter page is a text box with its own Undo and Redo that work a word at a time. |
| 97 | [Recipe](cases/97-recipe.md) | The Recipe page shares a recipe with the device's share sheet, or copies its link. |
| 98 | [Photos](cases/98-photos.md) | The Photos page shows five photos in a viewer that can go full screen. |
| 99 | [Delivery details](cases/99-delivery-details.md) | The Delivery details page is a form that reflows on narrow screens and with large text. |
| 100 | [Hotels](cases/100-hotels.md) | The Hotels page filters a hotel list in a sheet that covers the whole window. |
| 101 | [Lamps](cases/101-lamps.md) | The Lamps page shows product cards with Save and Compare buttons for mouse, keyboard and touch. |
| 102 | [Mailing list](cases/102-mailing-list.md) | The Mailing list page embeds a sign-up form that a separate script wires up after the page loads. |
| 103 | [Trip tags](cases/103-trip-tags.md) | The Trip tags page turns typed text into tags, also when the text comes from an input method. |
| 104 | [Concert tickets](cases/104-concert-tickets.md) | The Concert tickets page sells tickets and must be up to date when the user returns with Back. |
| 105 | [Privacy settings](cases/105-privacy-settings.md) | The Privacy settings page has a pop-up hint for each option and a confirmation after saving. |

## Run it

```sh
docker compose up --build
```

Open <http://localhost:3000> and start a sandbox. A sandbox is a private copy of the app; open its
URL in a second window to be the second user.

## Test hooks and API

[Test hooks](docs/test-hooks.md) reset, seed and break a sandbox from a test. [API](docs/api.md) lists the endpoints the pages use.

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
