# 59. Session

The Session page signs you out after 90 seconds without activity.

**Requirements to test:**

- After 60 seconds without a click, a key press or a scroll, a warning counts down the last 30
  seconds. Only **Stay signed in** keeps you signed in; other activity does not dismiss it.
- The warning takes focus, so a keyboard user can answer it at once.
- All tabs of the same sandbox share one session: activity in one tab counts in the others, and
  answering the warning or being signed out in one tab does the same in the others.
- A computer that sleeps through the timeout is signed out as soon as it wakes.
