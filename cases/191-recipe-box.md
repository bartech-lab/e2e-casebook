# 191. Recipe box

The Recipe box page shows a list of recipes, a count above it, and an editor beside the list. It keeps the answers of `GET /api/s/:id/recipes`, `GET /api/s/:id/recipes-count` and `GET /api/s/:id/recipes/<id>` and reuses them instead of asking again. **Save** sends `PUT /api/s/:id/recipes/<id>`; **Delete recipe** sends `DELETE`. The test hooks `POST /__test__/s/:id/recipe-delay` with `{ "ms" }` slows every save down, and `POST /__test__/s/:id/recipe-fail-next` makes the next save fail.

**Requirements to test:**

- After **Save**, the list shows the new title and minutes straight away, and opening the recipe again shows them too.
- After **Delete recipe**, the recipe is gone from the list and the count goes down.
- A save that fails says "Could not save. Try again.", keeps the editor open with what was typed, and the list keeps the old title.
- What the page shows is what the server has: reloading the page changes nothing.
