# 120. Flats

The Flats page lists four flats to rent in Kraków. Each card opens its flat at
`/s/:id/flats?flat=<flat id>`, and has a **Save** button and a **Compare** box.
**Requirements to test:**

- Clicking anywhere on a card, except **Save** and **Compare**, opens that flat in the same tab.
- The flat's title is a link to that flat's address, so it can be copied or opened in a new tab:
  Ctrl+click (Cmd+click on macOS) and a middle click open the flat in a new tab and leave this
  tab on the list.
- **Save** toggles between Save and Saved, and **Compare** ticks the box and updates "Comparing
  N of 4 flats.". Neither opens the flat.
- With the keyboard, Tab reaches each flat's link, and Enter opens the flat.
- **Back to flats**, or the browser's Back button, returns to the list with the same flats saved
  and ticked for comparison. A reload keeps them too.
