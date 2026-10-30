# 180. Printer status

The Printer status page shows whether the office printer can be reached, from `GET /api/s/:id/printer`. The test hook `POST /__test__/s/:id/printer-down` with `{ "down": true }` makes it answer `503`; `GET /__test__/s/:id/printer-checks` answers how many times the page asked.

**Requirements to test:**

- When the printer can be reached, the page says "Printer ready. 2 jobs waiting." and checks again every 10 seconds.
- When it cannot, the page says "Printer offline. Checking again in N s.", counting down, and checks again after 1 second, then 2, 4, 8 and 16, and from then on every 30 seconds.
- As soon as a check works, it is back to every 10 seconds; a later failure starts again from 1 second.
- **Check now** checks at once. It adds one check and never a second schedule: afterwards the page checks exactly as often as before, carrying on from where the waiting had got to.
- Leaving the page stops the checks.
