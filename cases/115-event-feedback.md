# 115. Event feedback

The Event feedback page asks for a name, a star rating and a comment. The rating is a
`<star-rating>` custom element. `GET /api/s/:id/event-feedback` lists what was sent as
`{ entries: [{ name, rating, comment }] }`.

**Requirements to test:**

- The rating is chosen by clicking a star, or from the keyboard: Tab to it, then the arrow keys
  (1 to 5), Home (1) and End (5).
- Screen readers find it as a slider named "Rating" whose value goes from 0 (no rating yet) to
  5.
- **Send** without a rating shows "Choose a rating." and sends nothing. A sent form shows
  "Thank you. Your rating of 4 was saved." and the server has the rating.
- **Clear**, and a successful send, empty the whole form, rating included.
- While **Feedback closed** is ticked, nothing in the form can be changed, the rating included.
