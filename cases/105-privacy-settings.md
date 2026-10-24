# 105. Privacy settings

The Privacy settings page lists four options, each with a **?** button that opens a short hint.
**Requirements to test:**

- A hint opens just below its **?** button, in full, never cut off by the card around it.
- The options sit in a list that scrolls on its own. While a hint is open, it stays just below its
  **?** button when the list scrolls, and it is hidden while its button is scrolled out of the
  list's visible area; scrolling the button back shows the hint again, still in place.
- Only one hint is open at a time. A hint closes when the user presses Escape, clicks its **?**
  again, or clicks anywhere else on the page.
- Each **?** button says whether its hint is open.
- **Save settings** shows "Settings saved." in the corner for 5 seconds. Opening a hint or
  clicking elsewhere does not hide it early. Saving again restarts the 5 seconds.
