# 79. Plans

The Plans page compares three plans. Each has an **i** button that shows a tooltip about the plan.

**Requirements to test:**

- Pointing at the button shows its tooltip after a short pause, so it does not flash when the
  pointer only passes over it. Moving focus to the button shows it at once.
- You can move the pointer from the button onto the tooltip, for example to read it at high
  zoom, and it stays open. It stays open until the pointer or focus leaves; it never closes by
  itself.
- Escape hides it without moving focus.
- Screen readers read the tooltip as the button's description.
- On a touch screen, tapping the button shows the tooltip and tapping again hides it.
- Only one tooltip is open at a time.
