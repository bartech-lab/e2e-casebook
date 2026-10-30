# 181. Holiday homes

The Holiday homes page lists four homes as cards. `GET /api/s/:id/holiday-homes/<home>` answers a home's details; `POST /api/s/:id/holiday-homes/<home>/views` counts a view; `GET /api/s/:id/holiday-home-views` answers the counts.

**Requirements to test:**

- When the pointer moves over a card, or keyboard focus reaches it, the page starts loading that home's details, once per home however often it is reached.
- Opening a card shows the details. When they were loaded in advance, it uses them; when they are still on their way, it waits for that same request instead of asking again.
- A home counts one view each time it is opened, and only then: pointing at it or focusing it never counts.
- If the details cannot be loaded, opening says "Could not open <home>.", and the next attempt asks again.
