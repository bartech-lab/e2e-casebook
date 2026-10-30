# 199. Exhibition

The Exhibition page shows six paintings. Choosing one opens it in a dialog and adds `?painting=<n>` to the address, so the painting can be linked to. The dialog closes with **Close**, with Escape, or with the browser's Back button. There is no server.

**Requirements to test:**

- Opening a painting adds one step to the history: Back closes the dialog and stays on the Exhibition page.
- Closing with **Close** or Escape takes that step away again, so the next Back leaves the Exhibition page, as if the dialog had never been opened.
- A link to a painting opens it straight away. Closing it stays on the Exhibition page, and Back then goes to wherever you were before the link.
- After the dialog closes, focus is back on the painting's button.
