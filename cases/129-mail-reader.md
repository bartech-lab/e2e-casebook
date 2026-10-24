# 129. Mail reader

The Mail reader page shows a message list on the left and the open message on the right. A bar
between them, named "Resize the message list", sets how much of the width the list takes. It
starts at 35%.
**Requirements to test:**

- Dragging the bar resizes the list, between 20% and 60% of the width, however far the pointer
  goes. The drag ends when the button is released, also if the pointer has left the bar or the
  page by then.
- With the keyboard, the bar can be focused. Arrow Left and Arrow Right change the width by 5
  points, Home and End go to 20% and 60%, and Enter hides the list and shows it again at the width
  it had.
- Double-clicking the bar puts it back to 35%.
- The bar tells assistive technology the list's current width in percent (0 while the list is
  hidden).
- The width is kept in this browser across reloads.
