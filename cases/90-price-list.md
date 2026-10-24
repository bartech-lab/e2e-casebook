# 90. Price list

The Price list page shows five products and their prices. The test hook
`POST /__test__/s/:id/price-list` with `{ "sku": "mug", "price": <grosze> }` changes a price, and
`GET /__test__/s/:id/price-list-requests` lists the requests the server got, with the status it
answered and the `If-None-Match` it received.

**Requirements to test:**

- **Check for new prices** says "Prices unchanged, checked at HH:MM." when nothing changed, and
  shows the new prices with "Prices updated at HH:MM." when something did, even a single price.
- When nothing changed, the browser does not download the list again: the server answers
  `304 Not Modified` to the browser's conditional request.
- The list is never shown out of date after a check: every check asks the server.
