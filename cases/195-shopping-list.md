# 195. Shopping list

The Shopping list page adds an item at once and saves it with `POST /api/s/:id/shopping`, which answers the item with its id. Ticking sends `PATCH /api/s/:id/shopping/<item>` with `{ "done" }` and removing sends `DELETE`. `GET /api/s/:id/shopping` lists what the server has. The test hooks `POST /__test__/s/:id/shopping-delay` with `{ "ms" }` slows every add down, and `POST /__test__/s/:id/shopping-fail-next` makes the next add fail.

**Requirements to test:**

- A new item shows at once, and you can tick it or remove it straight away, before the server has answered.
- What you did before the answer reaches the server once the item is saved: a ticked item is saved ticked, and a removed one is not on the server at all.
- The answer does not undo anything on screen.
- If adding fails, the item disappears and the page says "Could not add <item>."
