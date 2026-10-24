# 169. Cinema

The Cinema page shows six seats, A1 to A6, each with a **Reserve** button. The booking code is a separate file that the page downloads after it appears, which takes a while on a slow connection. `GET /api/s/:id/cinema/seats` lists the reserved seats as `{ "taken": ["A3"] }`.

**Requirements to test:**

- A click on **Reserve** always counts, also before the booking code has arrived: the seat is reserved once the code is there, and the page says "Seat <seat> reserved." The seat then shows as taken.
- Clicking a seat's button again while it is being reserved does nothing more: one seat, one reservation, no "already taken" message.
- If the booking code cannot be downloaded, the page says "Could not load the booking form." with **Try again**, which downloads it again and finishes the reservation.
- A seat someone else took says "Seat <seat> is already taken."
