# 100. Hotels

The Hotels page lists places to stay. A toolbar with a frosted, see-through background holds a
**Filters** button that opens a sheet of features.

**Requirements to test:**

- The toolbar stays at the top of the window while the list scrolls under it.
- The Filters sheet covers the whole window, at every window size. Nothing of the page shows
  through it, and nothing behind it can be clicked while it is open.
- The **Show hotels** button is always on the bottom edge of the window, without scrolling, even
  when the list of features is longer than the window. The list scrolls inside the sheet.
- Focus moves to the first feature when the sheet opens, and back to **Filters** when it closes
  (Show hotels, Close, or Escape). Close and Escape forget unsaved ticks.
- Only hotels that have every chosen feature are shown. The button shows how many features are
  chosen, for example "Filters (2)".
