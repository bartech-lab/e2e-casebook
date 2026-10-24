# 144. Radio favourites

The Radio favourites page lists three songs, each with a like button and a like count; you
already like "Rain on the Vistula". `GET /api/s/:id/songs` returns what is saved. The test hooks:
`POST /__test__/s/:id/song-pace` with `{ "ms": [400, 0] }` makes the server wait 400 ms on the
first save, 0 on the second, and so on in turn; `POST /__test__/s/:id/song-fail` with
`{ "times": 1 }` makes the next save fail; `GET /__test__/s/:id/song-writes` lists the saves in the
order the server applied them.
**Requirements to test:**

- A click changes the button and the count at once. The count includes your own like once.
- However quickly you click, and however the server's answers are delayed, what is saved always
  ends up the same as what the button shows.
- The button never flips back on its own while your clicks are being saved.
- If a save fails, the button goes back to what is saved, and the page says "Could not save your
  like. Try again."
