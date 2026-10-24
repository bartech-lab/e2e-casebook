# 81. Live score

The Live score page shows a match score. The test hook `POST /__test__/s/:id/goal` with
`{ "team": "home" }` or `"away"` scores a goal, and `GET /__test__/s/:id/score-reads` counts how
often the score was read.

**Requirements to test:**

- While the page is visible, the score updates within 3 seconds of a goal.
- While the tab is hidden, for example behind another tab, the page does not ask for the score.
- When you come back, the score updates at once, and a message says how many goals you missed
  while you were away, if any.
