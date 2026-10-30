# 170. Parts search

The Parts search page searches a list of bike parts while you type. `GET /api/s/:id/parts?q=` answers `{ "parts": [...] }`. When too many searches arrive, it answers `429 Too Many Requests` with a `Retry-After` header, either a number of seconds or a date.

**Requirements to test:**

- The page searches when you stop typing for 300 ms, once per pause, and shows the matching parts. With no match it says `No parts match "<text>".`
- After a `429`, the page says "Too many searches. Searching again in N s.", counting down whole seconds from the `Retry-After` value. The parts already shown stay.
- No search is sent before the wait is over, however much you type. When the wait ends, the page searches once, for the text in the box at that moment.
- Both forms of `Retry-After` work: seconds and a date.
- Emptying the box clears the parts at once and sends no search.
