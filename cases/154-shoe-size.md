# 154. Shoe size

The Shoe size page books a fitting for one EU shoe size, picked from a custom list that opens
over its button. It starts at EU 42. There is no server. What it requires:

- Clicking the button opens the list without changing the size. A click on a size picks it.
- Pressing on the button, sliding to a size and letting go picks that size, as with a native
  select. Letting go outside the list after sliding closes it without a change.
- With the keyboard: Arrow Down, Arrow Up, Enter or Space opens the list on the current size;
  the arrow keys move one size and stop at the ends, Home and End go to the first and last;
  Enter or Space picks. Escape and Tab close it without a change.
- Clicking anywhere else closes the list without a change.
- After picking or Escape, focus is on the button. Screen readers hear whether the list is open,
  which size is highlighted, and which is chosen.
- The page always says "Fitting booked for size N." for the size shown.
