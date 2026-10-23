# 48. Files

The Files page lists five files. **Delete** hides a file at once and shows "Deleted <name>. Undo".

**Requirements to test:**

- For 5 seconds, **Undo** brings the file back in its place, and the file is never deleted.
- After 5 seconds the file is deleted for good.
- Deleting another file finishes the earlier delete at once; only the latest can be undone.
- Leaving the page, by a link or by reloading or closing it, finishes a pending delete at once.
