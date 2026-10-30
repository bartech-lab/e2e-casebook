# 179. Café dashboard

The Café dashboard page shows three tiles: Orders, Stock and Reviews, each loading its own data. Stock lists items with a **Reorder** button (`POST /api/s/:id/cafe/reorders`). Errors go to the error log, `POST /api/s/:id/client-errors`, readable with `GET` on the same path. The test hook `POST /__test__/s/:id/cafe-faults` with `{ "badStock": 1 }` makes the next stock answer unusable (`{ "items": null }`), and with `{ "reorderFails": 1 }` makes the next reorder fail.

**Requirements to test:**

- A tile that cannot be shown says "This tile could not be shown." with **Try again**. The other tiles still show and work.
- Each such failure is written to the error log once, naming the tile ("Stock tile: ...").
- **Try again** loads the tile again, and shows it when the data is good.
- A reorder that fails says "Could not reorder <item>." in the Stock tile, is written to the error log once as "Stock tile: reorder failed", and leaves the tile working. A reorder that works says "<item> reordered."
