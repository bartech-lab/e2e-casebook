# 114. Groceries

The Groceries page adds products to a basket with **+** and **−** buttons.

**Requirements to test:**

- Every change to the basket is announced to screen reader users without moving their focus,
  for example "Added milk. 3 items in the basket." Adding the same product twice in a row is
  announced twice.
- A product that cannot be added is announced at once, interrupting other speech: "Eggs are out
  of stock." or "Only 2 apples left."
- The messages are also shown on the page, under the products.
