# 146. Ticket contact

The Ticket contact page asks for a name, email, phone and postal address. `GET /api/s/:id/ticket-contacts`
lists what was saved. `GET /api/s/:id/postcodes/:code` gives the city for a postal code; it knows
`00-950` (Warszawa), `30-001` (Kraków) and `80-001` (Gdańsk).
What it requires:

- Each field tells the browser what it is (`autocomplete`: `given-name`, `family-name`, `email`,
  `tel`, `postal-code`, `address-level2` for the city, `address-line1` for the street), so the
  browser can fill the form in one go.
- Whatever the browser fills in counts exactly like typing: it is checked, saved, and clears the
  message on that field. Filling never empties another field.
- A known postal code fills in the city when the city is still empty, also when the browser
  filled the postal code. It never replaces a city that is already there.
- A postal code may be written `30001` or `30-001`; it is saved as `30-001`.
- **Continue** with an empty or wrong field shows a message next to it. When all is right, the
  page says "Details saved for <first name>."
