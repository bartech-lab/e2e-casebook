# 96. Letter

The Letter page is a text box with **Undo** and **Redo** buttons.

**Requirements to test:**

- Undo takes back one step. Typing is grouped into steps: a step ends after a space or a new
  line, after a pause of more than 1 second, when you move the cursor, and when you switch
  between typing and deleting. Each paste is a step of its own.
- Redo brings back what Undo took. Typing or deleting after an Undo clears Redo.
- The last 50 steps can be undone.
- Ctrl+Z (Cmd+Z on a Mac) is Undo. Ctrl+Shift+Z and Ctrl+Y are Redo.
- After Undo the cursor is where the undone text was; after Redo it is at the end of the text
  that came back. You can keep typing there.
- **Undo** is disabled when there is nothing to undo, and **Redo** when there is nothing to
  redo.
