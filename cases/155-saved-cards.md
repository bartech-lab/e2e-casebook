# 155. Saved cards

The Saved cards page lists five payment cards, each with a **Remove** button that asks first.
The question fades in and out (300 ms). There is no server. What it requires:

- **Remove** asks "Remove <card>?" with focus on **Keep it**. **Keep it** and Escape close the
  question without a change and put focus back on the button that opened it.
- **Remove** in the question removes that card, says "Removed <card>.", and moves focus to the
  next card's Remove button, or the previous one for the last card.
- While a question fades out, the page can be used at once: another card's Remove opens a new
  question about that card, which stays open and behaves as above.
