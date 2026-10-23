# 43. Feedback

The Feedback page sends a star rating and an optional comment. The stars are a ready-made
`<rating-stars>` widget from another team, and its inside is closed to the page.

**Requirements to test:**

- Clicking a star picks that many stars. With the widget focused, the arrow keys move the rating
  by one star, and Home and End pick 1 and 5.
- **Send feedback** without a rating says "Choose a rating." and sends nothing.
- After sending, the page says "Thanks! You rated us N of 5." with the rating the server saved.
