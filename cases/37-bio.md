# 37. Bio

The Bio page has a small rich-text editor with **Bold** and **Italic** buttons (Ctrl+B and Ctrl+I
work too) and **Save**. The saved bio is shown below as your **Public profile**, which other people
see.

**Requirements to test:**

- Formatting applies to the text you selected, and the buttons show whether the text at the cursor
  is bold or italic.
- Formatting survives saving and reloading.
- Pasting from another page keeps bold, italic and links.
- The public profile shows only formatting and `http`/`https` links. Scripts, event handlers and
  `javascript:` links are removed, however the bio was sent.
