# 104. Concert tickets

The Concert tickets page sells tickets for one concert, 120 PLN each, at most 4 per order. After
paying, the browser goes to a separate receipt page. The test hook
`POST /__test__/s/:id/gig-stock` with `{ "left": 2 }` sets how many tickets are left, as if
other people had bought them.

**Requirements to test:**

- The page shows how many tickets are left, or "Sold out".
- **Pay** shows "Paying…" and cannot be pressed again until the payment is done or has failed.
- Asking for more tickets than are left shows "Not enough tickets left." and the current number
  of tickets left.
- When the user comes back from the receipt page with the browser's Back button, the page is up
  to date: the number of tickets left is the server's current number, "Your orders" lists the new
  order, and Pay is ready for another order.
