# 45. Updates

The Updates page tells you when a new version of the app has been released while the page was
open. The test hook `POST /__test__/s/:id/release` releases a new version for one sandbox.

**Requirements to test:**

- It checks every 30 seconds and whenever the window gets focus. It never shows the notice for the
  version you already run.
- A failed check is not shown and does not stop later checks.
- **Reload** loads the new version. **Later** hides the notice until an even newer version comes
  out.
