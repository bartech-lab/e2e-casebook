# 22. Playlist

The Playlist page lists five songs in an order you can change.

**Requirements to test:**

- Drag a song by its handle. Dropping it on the upper half of another song puts it before that
  song; the lower half puts it after.
- With the keyboard: focus a song's handle, press Space to pick it up, move it with the up and
  down arrow keys, and press Space to drop it. Escape puts it back where it was, also during a drag.
- After a move, the page announces "Moved <song> to position <n> of 5."
- The order is saved: a reload shows the same order.
