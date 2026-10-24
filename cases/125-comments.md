# 125. Comments

The Comments page collects comments on a plan. The comment box is 2 lines tall when empty.
**Requirements to test:**

- The box grows one line at a time as the text needs more lines, whether you type, add a line with
  Shift+Enter, or paste, up to 6 lines. From then on it stays 6 lines tall and scrolls, and the
  wheel scrolls it.
- When text is deleted, the box shrinks again, never below 2 lines.
- Long words wrap; the box never scrolls sideways, also on a narrow phone screen.
- Enter sends the comment and Shift+Enter starts a new line. **Send** does the same as Enter.
  A sent comment is listed under "Your comments", the box empties and is 2 lines tall again.
- A comment of only spaces or empty lines is not sent.
