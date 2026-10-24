# 111. Bus stop

The Bus stop page links to a departures board, `/embed/bus/?sandbox=<id>`, a separate page with a
service worker. The test hooks `POST /__test__/s/:id/bus` with
`{ "departures": [{ "line", "to", "time" }] }` change the departures, and
`POST /__test__/s/:id/bus-fail` with `{ "times": N }` makes the next N requests for departures
fail.

**Requirements to test:**

- Online, the board always shows the server's current departures, never older ones.
- After one visit online, the board opens without a network and shows the last departures it
  received, with "Offline: showing the times saved at HH:MM."
- When the server fails while online, the board says "Departures are not available right now."
  A failed answer never replaces the saved departures.
