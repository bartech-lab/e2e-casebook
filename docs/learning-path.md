# Learning path

Twelve steps through the case themes, from locators to test environments. Each step names two or three cases to test, solved ones first, and the [QA Interview Bank](https://github.com/bartech-lab/qa-interview-bank) questions that explain the technique. Try a case on the live demo, or run real Playwright in the [dev container](../.devcontainer/devcontainer.json) (see the README).

The live demo sleeps when idle and can take about a minute to wake.

## 1. Forms and input

Start with locators: labels, roles and form state. Practise them first in the bank's [Locators tab](https://bartech-lab.github.io/qa-interview-bank/#locators), on frozen copies of these pages.

| Case | Live | Worked solution |
|---|---|---|
| [138. Billing details](../cases/138-billing-details.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=billing-details) |  |
| [29. Booking](../cases/29-booking.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=booking/dates) |  |
| [28. Quote](../cases/28-quote.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=quote) |  |

Read first in the QA Interview Bank:

- [What is the priority order of locators in Playwright, and why?](https://bartech-lab.github.io/qa-interview-bank/#q0018)
- [How does getByRole work, and how do you find the accessible name?](https://bartech-lab.github.io/qa-interview-bank/#q0019)
- [What is strictness in Playwright locators? What do you do on a "strict mode violation"?](https://bartech-lab.github.io/qa-interview-bank/#q0020)
- [How do you filter and chain locators?](https://bartech-lab.github.io/qa-interview-bank/#q0021)
- [How do test.step and a custom expect message help reporting?](https://bartech-lab.github.io/qa-interview-bank/#q0017)

## 2. Accessibility and keyboard

Roles, names and keyboard behaviour: what `getByRole` reads, and what people using assistive technology need.

| Case | Live | Worked solution |
|---|---|---|
| [92. Product details](../cases/92-product-details.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=product-tabs) | [Solution](../solutions/cases/aria-tabs/README.md) |
| [16. The People picker](../cases/16-the-people-picker.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=shop) |  |
| [199. Exhibition](../cases/199-exhibition.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=exhibition) |  |

Read first in the QA Interview Bank:

- [Does an assertion on a negated state need anything special, for example "the dialog is closed"?](https://bartech-lab.github.io/qa-interview-bank/#q0016)

## 3. Lists, layout and scrolling

Many similar rows: filter, scope and check order, not only presence.

| Case | Live | Worked solution |
|---|---|---|
| [46. Inbox](../cases/46-inbox.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=inbox) |  |
| [150. Site photos](../cases/150-site-photos.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=site-photos) |  |
| [100. Hotels](../cases/100-hotels.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=hotels) |  |

Read first in the QA Interview Bank:

- [What is wrong with this test? (strict mode and brittle selectors)](https://bartech-lab.github.io/qa-interview-bank/#q0082)
- [How do you assert on a list or a table with locators?](https://bartech-lab.github.io/qa-interview-bank/#q0027)
- [Home task: test a sortable table. Check that sorting is right, not only that something moved.](https://bartech-lab.github.io/qa-interview-bank/#q1042)
- [A click times out. What do you look at?](https://bartech-lab.github.io/qa-interview-bank/#q0077)

## 4. Async, races and network

Web-first assertions, waiting for the right response, and races you have to provoke.

| Case | Live | Worked solution |
|---|---|---|
| [10. A toast and a page that is never idle](../cases/10-a-toast-and-a-page-that-is-never-idle.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=settings) | [Solution](../solutions/cases/toast-and-polling/README.md) |
| [38. Search](../cases/38-search.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=search) | [Solution](../solutions/cases/search-race/README.md) |
| [3. Optimistic moves](../cases/03-optimistic-moves.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=board) | [Solution](../solutions/cases/optimistic-moves/README.md) |

Read first in the QA Interview Bank:

- [What does "web-first" mean in Playwright assertions?](https://bartech-lab.github.io/qa-interview-bank/#q0001)
- [Which assertions retry and which do not? Name examples of each.](https://bartech-lab.github.io/qa-interview-bank/#q0003)
- [Why should you not use waitForTimeout, and what do you use instead?](https://bartech-lab.github.io/qa-interview-bank/#q0004)
- [What is the difference between toHaveText and toContainText, and what does toHaveText normalize?](https://bartech-lab.github.io/qa-interview-bank/#q0010)
- [What is wrong with this test? (one-shot check and sleep)](https://bartech-lab.github.io/qa-interview-bank/#q0081)
- [Home task: this test is flaky. Find the reasons and fix it.](https://bartech-lab.github.io/qa-interview-bank/#q1046)

## 5. Time, dates and locales

Clocks, time zones and DST: control time instead of waiting for it.

| Case | Live | Worked solution |
|---|---|---|
| [6. Due dates, time zones, and DST](../cases/06-due-dates-time-zones-and-dst.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=board) | [Solution](../solutions/cases/due-dates/README.md) |
| [84. Flash sale](../cases/84-flash-sale.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=flash-sale) |  |
| [134. Club activity](../cases/134-club-activity.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=club-activity) |  |

Read first in the QA Interview Bank:

- [What can you put in use, and how do you scope it?](https://bartech-lab.github.io/qa-interview-bank/#q0052)
- [How do you emulate time zones, locale and geolocation?](https://bartech-lab.github.io/qa-interview-bank/#q0072)
- [What is wrong with this time-zone and date test?](https://bartech-lab.github.io/qa-interview-bank/#q0089)
- [How do you control time in a test? What is the clock API?](https://bartech-lab.github.io/qa-interview-bank/#q0071)
- [How do you reduce flaky screenshots: thresholds, masking and animations?](https://bartech-lab.github.io/qa-interview-bank/#q0137)

## 6. Sign-in, sessions and security

Sessions, storage state and tokens: sign in once, then test the edges on their own.

| Case | Live | Worked solution |
|---|---|---|
| [8. Magic-link sign-in](../cases/08-magic-link-sign-in.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=account) | [Solution](../solutions/cases/magic-link/README.md) |
| [56. Stay signed in](../cases/56-stay-signed-in.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=sign-in) |  |
| [187. Team overview](../cases/187-team-overview.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=team-overview) |  |

Read first in the QA Interview Bank:

- [When is an explicit wait the right tool? What is locator.waitFor?](https://bartech-lab.github.io/qa-interview-bank/#q0011)
- [How do you share a worker-scoped value that needs the browser?](https://bartech-lab.github.io/qa-interview-bank/#q0044)
- [How do you handle authentication in Playwright tests? Walk me through the full setup.](https://bartech-lab.github.io/qa-interview-bank/#q0054)
- [How do you authenticate with the API instead of the UI?](https://bartech-lab.github.io/qa-interview-bank/#q0059)
- [What is wrong with this test? (auth in every test and a leaked state)](https://bartech-lab.github.io/qa-interview-bank/#q0086)
- [How do you share authentication between the API client and the browser?](https://bartech-lab.github.io/qa-interview-bank/#q0121)

## 7. Files, uploads and downloads

Downloads and uploads: wait for the event, then check the file itself.

| Case | Live | Worked solution |
|---|---|---|
| [78. Statement](../cases/78-statement.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=statement) |  |
| [39. Invoices](../cases/39-invoices.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=invoices) |  |
| [72. Upload](../cases/72-upload.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=upload) |  |

Read first in the QA Interview Bank:

- [How do you wait for a network response triggered by a click without a race?](https://bartech-lab.github.io/qa-interview-bank/#q0012)
- [How do you test a file download?](https://bartech-lab.github.io/qa-interview-bank/#q0068)
- [Live task, 15 min: test a file download (export to CSV).](https://bartech-lab.github.io/qa-interview-bank/#q1014)

## 8. Money and checkout

Totals and rules: check what the app promises, not what it happens to do.

| Case | Live | Worked solution |
|---|---|---|
| [11. Checkout total](../cases/11-checkout-total.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=shop) | [Solution](../solutions/cases/checkout-total/README.md) |
| [121. Parking permit](../cases/121-parking-permit.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=parking) |  |
| [104. Concert tickets](../cases/104-concert-tickets.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=gig-tickets) |  |

Read first in the QA Interview Bank:

- [The tests pass but the product has a bug. Why might that happen with Playwright tests?](https://bartech-lab.github.io/qa-interview-bank/#q0079)
- [How do you work with iframes in Playwright?](https://bartech-lab.github.io/qa-interview-bank/#q0023)
- [What is wrong with this test? (iframe, hidden check and networkidle)](https://bartech-lab.github.io/qa-interview-bank/#q0087)

## 9. Offline, caching and storage

Service workers, IndexedDB and local storage: state that outlives the page.

| Case | Live | Worked solution |
|---|---|---|
| [111. Bus stop](../cases/111-bus-stop.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=bus-stop) |  |
| [95. Local notes](../cases/95-local-notes.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=local-notes) |  |
| [31. Checklist](../cases/31-checklist.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=checklist) |  |

Read first in the QA Interview Bank:

- [Why does page.route not see requests when the app uses a service worker (for example MSW)?](https://bartech-lab.github.io/qa-interview-bank/#q0113)

## 10. Browser APIs and devices

Permissions, geolocation and consent: set the browser up before the page asks.

| Case | Live | Worked solution |
|---|---|---|
| [27. Stores](../cases/27-stores.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=stores) |  |
| [17. Cookie consent](../cases/17-cookie-consent.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=deals) |  |

Read first in the QA Interview Bank:

- [How do you emulate time zones, locale and geolocation?](https://bartech-lab.github.io/qa-interview-bank/#q0072)

## 11. Realtime and multi-user

Two browsers, one sandbox: WebSockets, reconnects and ordering.

| Case | Live | Worked solution |
|---|---|---|
| [1. Two-user realtime chat](../cases/01-two-user-realtime-chat.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=chat) | [Solution](../solutions/cases/realtime-chat/README.md) |
| [2. Concurrent edit](../cases/02-concurrent-edit.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=board) | [Solution](../solutions/cases/concurrent-edit/README.md) |
| [166. Kitchen timer](../cases/166-kitchen-timer.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=kitchen-timer) |  |

Read first in the QA Interview Bank:

- [Why is networkidle a bad wait, and what do you wait for instead?](https://bartech-lab.github.io/qa-interview-bank/#q0014)
- [What is a browser context, and why does it matter for tests?](https://bartech-lab.github.io/qa-interview-bank/#q0030)
- [How do you test a chat with two users in Playwright?](https://bartech-lab.github.io/qa-interview-bank/#q0158)
- [How do you wait for or assert on WebSocket messages?](https://bartech-lab.github.io/qa-interview-bank/#q0159)
- [How does routeWebSocket work, and when do you use it?](https://bartech-lab.github.io/qa-interview-bank/#q0160)
- [How do you test reconnect behaviour?](https://bartech-lab.github.io/qa-interview-bank/#q0161)

## 12. Test environments

Parallel runs and feature flags: tests that pass alone and fail together.

| Case | Live | Worked solution |
|---|---|---|
| [7. A shared environment](../cases/07-a-shared-environment.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=board) | [Solution](../solutions/cases/shared-environment/README.md) |
| [5. Feature flag](../cases/05-feature-flag.md) | [Try it](https://e2e-proving-ground.onrender.com/?try=board) | [Solution](../solutions/cases/feature-flag/README.md) |

Read first in the QA Interview Bank:

- [How does the Playwright test runner execute tests: processes, files and order?](https://bartech-lab.github.io/qa-interview-bank/#q0035)
- [What is the difference between test-scoped and worker-scoped fixtures?](https://bartech-lab.github.io/qa-interview-bank/#q0037)
- [When do tests need one account per worker?](https://bartech-lab.github.io/qa-interview-bank/#q0057)
- [How do you make tests isolated for parallel runs?](https://bartech-lab.github.io/qa-interview-bank/#q0062)
- [What is a test lock, and when do you use it?](https://bartech-lab.github.io/qa-interview-bank/#q0064)
- [What is wrong with this fixture and test? (shared state and teardown)](https://bartech-lab.github.io/qa-interview-bank/#q0084)

Links to the bank come from its [case links](https://github.com/bartech-lab/qa-interview-bank/blob/main/src/casebook.json).
