# 91. Contributors

The Contributors page shows eight names on cards of a fixed width. The cards get narrower on a
screen 600 px wide or less.

**Requirements to test:**

- A name that does not fit on its card ends with "…". A name that fits is shown whole, without
  "…".
- Pointing at a cut name, or moving keyboard focus to it, shows the whole name in a tooltip.
  Names that fit show no tooltip. Escape closes it.
- Screen readers always get the whole name.
- When the window gets narrower or wider, the same rules hold for the new width without a
  reload.
