# 3. Optimistic moves

Cards move between columns at once, before the server answers.

**Requirements to test:**

- A move the server rejects is undone, with one error message.
- Undoing one failed move never undoes a different move that succeeded, including a later move
  of the same card.
- Once nothing is pending, the board shows what the server has.
