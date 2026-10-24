# 139. Flight search

The Flight search page finds flights between two airports with `GET /api/s/:id/flights`. The
test hook `POST /__test__/s/:id/flight-pace` with `{ "ms": 7000 }` makes the server wait that long
before it answers, and `GET /__test__/s/:id/flight-requests` returns
`{ "started": n, "completed": n, "aborted": n }`.
**Requirements to test:**

- **Search flights** shows "Searching…" and a **Cancel** button. After 5 seconds without an answer
  it says "Still searching. This can take up to 20 seconds."
- **Cancel** stops the search: the request is aborted, the page says "Search cancelled.", and the
  airports you chose stay chosen.
- After 20 seconds without an answer the page gives up, aborts the request, and says "The search
  took too long. Try again."
- An answer that arrives after a search was cancelled or gave up is never shown.
- When the answer comes in time, the flights are listed and no later message replaces them.
