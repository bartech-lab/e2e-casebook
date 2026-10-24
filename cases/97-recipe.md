# 97. Recipe

The Recipe page has a **Share recipe** button.

**Requirements to test:**

- Where the browser can share (the Web Share API), the button opens the device's share sheet
  with the recipe's title, a short text, and the recipe's address without anything after `?`
  or `#`. After sharing, the page says "Shared."
- Closing the share sheet without sharing is not an error: the page says nothing.
- Where the browser cannot share, or sharing fails for another reason, the button copies the
  address and the page says "Link copied."
- If copying is not allowed either, the page says "Copy this link:" and shows the address in a
  field, already selected, so it can be copied by hand.
