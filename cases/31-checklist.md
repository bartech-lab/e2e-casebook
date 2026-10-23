# 31. Checklist

The Checklist page keeps a list of items and keeps working when the connection drops.

**Requirements to test:**

- A new item appears at once. While the browser is offline, the page says "Offline. Changes will
  sync when you are back online." and new items are marked "(not synced)".
- Unsynced items are kept in the browser. When the connection is back, they are sent in the order
  they were added, and the mark disappears. A send that fails is retried every 2 seconds.
- Every item is saved once, even when a send fails after the server got it: the page retries with
  the same item id, and the server ignores an id it already has.
