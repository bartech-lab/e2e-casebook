# 10. A toast and a page that is never idle

Saving Settings shows "Settings saved" for 2 seconds. Every sandbox page keeps a long-polling
request open for notifications.

**Requirements to test:**

- The toast appears only after the server has stored the settings, never when the save fails.
- The toast disappears after 2 seconds.
