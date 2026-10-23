# 63. Confirm email

The Confirm email page asks for a 6-digit code, one box per digit.

**Requirements to test:**

- Typing a digit moves to the next box; letters are ignored. Backspace in an empty box goes back
  and clears the previous digit. The arrow keys move between boxes.
- Pasting a code into any box fills all six, also when it has spaces. A phone's code autofill
  fills all six too.
- The code is checked as soon as six digits are in. A wrong code clears the boxes and puts you
  back at the first one. After three wrong codes, only a new code helps.
