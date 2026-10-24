# 162. Newsroom

The Newsroom page lists local news stories, newest first, ten at a time. `GET /api/s/:id/news` serves them. The test hook `POST /__test__/s/:id/news-publish` with `{ "count": 3 }` publishes that many new stories at the top, as the editors do all day.

**Requirements to test:**

- **Load more** adds the next ten older stories under the ones shown. No story ever appears twice and none is skipped, also when new stories were published since the page opened.
- After the oldest story, **Load more** gives way to "No older stories."
- Pressing **Load more** twice quickly loads one page, not two.
- When loading fails, the page says "Could not load more stories." with **Try again**, and keeps the stories it has.
- Opening a story and coming back with the browser's Back button shows the same stories, including the extra pages loaded, at the same scroll position, without loading them again.
