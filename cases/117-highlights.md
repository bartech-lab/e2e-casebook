# 117. Highlights

The Highlights page shows an article.

**Requirements to test:**

- When the reader selects text in the article, by dragging, double-clicking a word or
  triple-clicking a paragraph, a **Save highlight** button appears just above the end of the
  selection, without covering the selected text.
- Selecting text outside the article, such as the title, or selecting only spaces, shows no
  button. When the selection goes away, so does the button.
- **Save highlight** adds the selected text to Your highlights with spaces around it removed and
  every run of spaces and line breaks turned into one space, so a selection across two paragraphs
  becomes one line. Then the selection and the button go away.
- A selection longer than 280 characters cannot be saved: the button is disabled and says
  "Highlights can be up to 280 characters."
