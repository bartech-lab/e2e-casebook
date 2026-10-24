# 98. Photos

The Photos page shows five photos in a viewer with **Previous photo**, **Next photo** and
**Full screen** buttons.

**Requirements to test:**

- **Full screen** puts the viewer, not the whole page, in full screen, and the button then says
  **Exit full screen**.
- However full screen ends (the button, Escape, or the browser's own controls), the button says
  **Full screen** again.
- In full screen, keyboard focus is in the viewer, and the Left and Right arrow keys show the
  previous and next photo.
- If the browser refuses full screen, the viewer fills the window instead, with the same
  buttons and keys, and Escape or **Exit full screen** puts it back.
