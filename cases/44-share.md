# 44. Share

The Share page shows an invite link with **Copy link** and **New link** buttons.

**Requirements to test:**

- **Copy link** puts the full link, starting with `http`, on the clipboard and says "Link
  copied."
- **New link** replaces the link; after that, **Copy link** copies the new one.
- If the browser refuses to copy, the page says so, selects the link, and asks you to press
  Ctrl+C. It never says "Link copied." when nothing was copied.
