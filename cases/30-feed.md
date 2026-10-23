# 30. Feed

The Feed page lists posts, newest first. It starts with 35 posts, and anyone can add one with
`POST /api/s/:id/feed`.

**Requirements to test:**

- The page shows the 10 newest posts. Scrolling to the end loads the next 10, until every post
  is shown; then it says "No more posts."
- Every post appears exactly once, in order, even when new posts arrive while you scroll.
- New posts do not move the list. Within 3 seconds a button says how many arrived ("3 new
  posts"); clicking it puts them at the top.
