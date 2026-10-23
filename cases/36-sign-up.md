# 36. Sign up

The Sign up page creates an account (nothing is stored). It must work for people who use a
keyboard or a screen reader.

**Requirements to test:**

- Every field has a visible label, and every control is a real control you can reach with Tab.
- When you submit with mistakes, each mistake is shown under its field, read out with the field,
  and the cursor moves to the first field with a mistake.
- **Account created** opens as a dialog. Tab and Shift+Tab stay inside it, Escape closes it, and
  closing it puts the cursor back on **Create account**.
- Text, error messages included, meets WCAG AA contrast.
