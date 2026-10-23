# 2. Concurrent edit

Two people open the same card on the board and both edit it.

**Requirements to test:**

- A save based on an outdated version never overwrites the newer one silently.
- The second person sees who changed the card and what they wrote, and chooses: **Use theirs**
  loads the newer version into the form; **Keep mine** saves their own text on top of it.
