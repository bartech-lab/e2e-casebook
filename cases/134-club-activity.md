# 134. Club activity

The Club activity page lists what happened in a tennis club, each with the time it happened.
`GET /api/s/:id/club-activity` returns the events; the test hook `POST /__test__/s/:id/club-activity`
with `{ "events": [{ "text": "...", "at": "<ISO date>" }] }` replaces them.
**Requirements to test:**

- Times read, by the visitor's clock and calendar: "just now" under a minute; "1 minute ago",
  "N minutes ago" under an hour; "1 hour ago", "N hours ago" earlier the same day;
  "yesterday at HH:MM" (24-hour) the day before; "D Month" (for example "12 March") earlier this
  year; "D Month YYYY" in other years.
- A time slightly in the future (the server's clock may be ahead) reads "just now".
- The times update by themselves, at least every minute, without a reload.
- Each time carries its exact moment as a machine-readable date (`<time datetime>`).
