# 113. Saved searches

The Saved searches page lists the user's saved searches from `GET /api/s/:id/saved-searches`,
which answers after about 200 ms. The test hook `POST /__test__/s/:id/saved-searches` with
`{ "names": ["Bikes"], "delayMs": 1500 }` (either key) sets the saved searches and how long the
list takes.

**Requirements to test:**

- Until the list arrives, the page shows "Loading saved searches…" and no buttons.
- "You have no saved searches." and **Create your first search** appear only when the server has
  no saved searches, never while the list is loading.
- Otherwise the page shows the searches and a **New search** button.
- **Create your first search** saves a search named "My first search"; **New search** saves one
  named "Untitled search N", where N counts the saved searches. Both save on the server and add
  the search to the list; after the first one the empty state is gone.
