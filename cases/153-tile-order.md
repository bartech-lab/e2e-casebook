# 153. Tile order

The Tile order page builds an order of floor tiles: add a tile, set how many square metres, and
send it. `GET /api/s/:id/tile-orders` lists the orders sent. What it requires:

- The order you are building belongs to this browser tab. It stays when you reload the tab, but
  another tab of the same page, even in the same browser, starts with an empty order and never
  changes this one.
- Adding a tile that is already in the order adds one more square metre. Each tile takes 1 to
  99 m²; the total is the sum of price times square metres.
- **Send order** sends exactly what is shown, once, however often it is clicked, and says
  "Order N sent.". The tab's order is then empty, also after a reload. Orders being built in
  other tabs stay as they were.
- If sending fails, the page says "Could not send the order. Try again." and keeps the order.
