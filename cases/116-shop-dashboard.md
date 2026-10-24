# 116. Shop dashboard

The Shop dashboard page has a Recent orders widget and a **Filters** button that opens a Filters
panel.

**Requirements to test:**

- The widget lists orders as a table with column headers when the widget is at least 26rem
  (416 CSS pixels) wide, and as one card per order, each value with its label, when it is
  narrower. Whatever makes the widget narrow counts: a small window, or the Filters panel open
  beside it on a wide window.
- Opening or closing Filters switches the layout at once.
- The Filters panel sits beside the widget, or below it on small windows, and never covers it.
- Nothing in the widget is wider than the widget.
