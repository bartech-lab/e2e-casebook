# 38. Search

The Search page finds products as you type.

**Requirements to test:**

- It searches once you stop typing for 300 ms, not on every key.
- The list always shows the results for the text in the status line, and the status line names
  the text those results are for (for example `3 results for “lamp”`).
- When you change the text, results for older text never replace newer ones, however slowly they
  arrive.
- Any text works, `&` and accents included. An empty box shows nothing.
