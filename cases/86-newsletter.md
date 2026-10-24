# 86. Newsletter

The Newsletter page shows 8 articles one under another. Article 5 is much taller than the
screen.

**Requirements to test:**

- An article becomes read once at least half of it, or for an article taller than the screen at
  least half of the screen, has been in view for 2 seconds in a row.
- Scrolling past an article does not mark it. Leaving it and coming back starts the 2 seconds
  again.
- Time while the tab is hidden does not count.
- Unread articles show **New**. The count at the top says how many are read.
- Read articles stay read after a reload.
