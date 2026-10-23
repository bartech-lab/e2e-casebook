# 47. Orders

The Orders page shows orders ten at a time, sorted on the server. The test hook
`POST /__test__/s/:id/order-list` with `{ orders: [{ number, customer, total, date }] }` replaces the
orders of one sandbox (`total` in grosze).

**Requirements to test:**

- A click on a column heading sorts by that column, smallest first; a second click reverses it.
  Totals sort as amounts and dates as dates. Orders that tie keep order-number order, in both
  directions.
- The sorted column says which way it is sorted (`aria-sort`).
- Sorting again starts from page 1. **Previous** and **Next** stop at the first and last page,
  and every order appears on exactly one page.
