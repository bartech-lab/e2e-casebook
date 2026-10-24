# 147. Handbook

The Handbook page has a menu, "Handbook sections", with four sections. Each section's button
opens and closes its list of pages.
What it requires:

- A section button reached with the keyboard shows a clear focus ring (a solid outline at least
  2 pixels wide). The ring stays when the button is pressed with Enter or Space, and also when a
  screen reader presses it: a screen reader such as NVDA or JAWS sends a click, not a key.
- A button clicked with a mouse does not show the ring.
- Pressing a section button, in any way, leaves the focus on that button.
- Each section button says whether its section is open (`aria-expanded`).
