# 46. Inbox

The Inbox page lists eight messages with a checkbox each.

**Requirements to test:**

- Shift+click on a checkbox selects (or clears) every message between it and the checkbox you
  clicked before, in either direction, both ends included.
- **Select all** selects every message shown. When only some are selected, it shows a mixed
  state.
- **Unread only** hides read messages. Hidden messages are never archived, even if you selected
  them before hiding them.
- **Archive selected (N)** archives exactly the N messages shown as selected, then clears the
  selection.
