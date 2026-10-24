# 135. Notice board

The Notice board page lists eight office notices and says how many are unread.
`GET /api/s/:id/notices` returns them; `POST /api/s/:id/notices/read` with `{ "ids": [2] }` marks
notices read. The test hook `GET /__test__/s/:id/notice-reads` returns how many times each notice
was sent as read, for example `{ "reads": { "2": 1 } }`.
**Requirements to test:**

- A notice counts as read once at least half of it has been on screen for one second without a
  break. Scrolling past it faster does not count, and neither does a notice only partly in view.
- The unread count and the notice's own "Read" label change as soon as it counts as read.
- Reads are saved, so they stay read after a reload. Each notice is sent as read only once.
