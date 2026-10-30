# 194. Meeting rooms

The Meeting rooms page books the Blue room at 09:00, 10:00 or 11:00. Booking takes three requests: `POST /api/s/:id/room-bookings` saves the booking, `POST /api/s/:id/room-bookings/<booking>/invite` sends the calendar invite, and `GET /api/s/:id/rooms` refreshes the list. The test hooks `POST /__test__/s/:id/room-fail` with `{ "step": "book" | "invite" | "list" }` makes the next request of that step fail, and `GET /__test__/s/:id/room-stats` answers `{ "bookAttempts", "bookings", "invites" }`.

**Requirements to test:**

- When the booking is saved but the invite fails, the page says "Room booked for <time>. The calendar invite could not be sent." and offers **Send invite again**, which sends only the invite, not a second booking.
- When the booking is saved but the list cannot be refreshed, the page still says the room is booked, adds "The list could not be refreshed.", and shows the time as booked.
- When the booking itself fails, the page says "Could not book the room. Nothing was booked." and the time stays free.
- Each message names what worked first, then what did not.
