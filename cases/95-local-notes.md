# 95. Local notes

The Local notes page keeps notes in this browser (IndexedDB), not on the server. The page asks
the server which version of its notes database to use; version 2 adds **Pin**. The test hook
`POST /__test__/s/:id/notes-schema` with `{ "version": 2 }` releases version 2.

**Requirements to test:**

- Notes stay after a reload.
- When version 2 opens in a new tab, every note is kept and gets a **Pin** box, unticked.
- A tab still on version 1 stops editing at once and says "A newer version is open in another tab.
  Reload this tab to keep editing.", and lets the new tab update.
- If something else in the browser keeps the old database open, the new tab says "Close other
  tabs of this app to finish updating your notes." and finishes by itself once it can.
