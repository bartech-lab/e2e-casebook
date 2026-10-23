# 33. Basket

The Basket page keeps a basket in the browser, without the server.

**Requirements to test:**

- **+** and **−** change a product's quantity; the line "Basket: N items" counts every unit.
- Every tab of the same sandbox in the same browser shares the basket. A change in one tab shows in
  the others within a second, without a reload, and a new tab shows the current basket.
- **Empty basket** empties it in every tab.
- Each sandbox has its own basket.
