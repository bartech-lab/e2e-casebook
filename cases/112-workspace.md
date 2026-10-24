# 112. Workspace

The Workspace page loads the workspace's settings from `GET /api/s/:id/workspace`, which answers
after about 300 ms. The test hook `POST /__test__/s/:id/workspace` with
`{ "setupDone": false, "delayMs": 1500 }` (either key) changes whether setup is finished and how
long the settings take.

**Requirements to test:**

- Until the settings arrive, the page shows "Loading your workspace…" and nothing else.
- A workspace that has not finished setup opens on Setup. It never shows the Dashboard, not even
  for a moment.
- A finished workspace opens on the Dashboard. After that the page never changes the tab by
  itself: whatever the user opens, such as Reports, stays open, also when the user comes back to
  the browser window.
- **Finish setup** saves it on the server and opens the Dashboard; the next visit opens on the
  Dashboard too.
