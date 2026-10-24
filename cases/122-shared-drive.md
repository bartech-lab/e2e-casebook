# 122. Shared drive

The Shared drive page lists six files. Right-clicking a file, or pressing Shift+F10 or the menu key
while it has focus, opens a menu named "Actions for <file name>" with **Open**, **Duplicate** and
**Delete**.
**Requirements to test:**

- The menu opens where the file was right-clicked (or on the file, from the keyboard), and is
  always fully inside the window: near the right or bottom edge it opens to the left or upwards.
- When the menu opens, its first item has focus. Arrow Down and Arrow Up move between the items
  and wrap around; Home and End go to the first and last item.
- Escape closes the menu and puts focus back on the file. Clicking outside the menu, scrolling, or
  Tab closes it too.
- **Open** says "Opened <file name>.". **Duplicate** adds "<name> (copy).<extension>" right after
  the file and says "Made <copy name>.". **Delete** removes the file, says "Deleted <file name>.",
  and moves focus to the file that took its place (or the new last file).
- Every action applies to the file whose menu was opened, also after menus were opened on other
  files.
