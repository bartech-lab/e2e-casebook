# 92. Product details

The Product details page shows a hand grinder with four tabs: Description, Specifications,
Reviews and Shipping.

**Requirements to test:**

- The tabs follow the WAI-ARIA tabs pattern: only the selected tab is in the Tab order, and the
  next Tab goes to its panel.
- Left and Right arrow keys move to the previous and next tab and show it at once, wrapping
  around at the ends. Home and End go to the first and last tab.
- Screen readers hear which tab is selected and which tab each panel belongs to.
- Clicking a tab shows it. The selected tab is in the address (`#specs`), so a reload or a link
  opens the same tab.
