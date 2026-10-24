# 157. Cookbook

The Cookbook page lists 30 recipes, far more than fit on the screen. **Share** on a recipe opens
a dialog; **Change who can see it** opens a second dialog on top. There is no server. What it
requires:

- While a dialog is open, the page behind it does not scroll, and does not move: not to the top,
  and not sideways when the page's scroll bar goes away.
- Closing the last dialog (Done, Escape, or picking who can see it) leaves the page exactly where
  it was, and puts focus back on the button that opened the Share dialog.
- Closing the second dialog leaves the first open and the page still held. Escape closes only the
  dialog on top.
- Picking Public or Friends shows it under the recipe ("Seen by: Friends").
