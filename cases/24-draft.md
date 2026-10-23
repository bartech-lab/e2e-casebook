# 24. Draft

The Draft page holds one letter that saves itself.

**Requirements to test:**

- The letter saves 1 second after you stop typing, not before. While it saves, the status says
  "Saving…"; once the server has the latest text, it says "All changes saved".
- If a save fails, the status says "Not saved. Retrying…" and the page tries again every 2
  seconds until a save succeeds.
- A reload shows the latest saved text. A save that finishes late never replaces newer text.
