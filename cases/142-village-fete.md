# 142. Village fête

The reply form is a plain page at `/api/s/:id/rsvp`, built by the server, which the Village fête
page links to. A script, `/embed/rsvp/rsvp.js`, improves it once it has loaded; on a slow
connection that can take a while. `GET /api/s/:id/rsvps` lists the replies as
`{ "replies": [{ "name": "...", "guest": "..." | null, "note": "..." }] }`.
**Requirements to test:**

- The form works from the moment it appears, before the script has loaded, and with JavaScript
  turned off. **Reply** then shows "See you there, <name>!" on a new page.
- Once the script has loaded, **Reply** shows the same message without loading a new page.
- Whatever you typed or ticked before the script loaded is kept when it loads.
- **Guest's name** is shown only while "I am bringing a guest" is ticked, also when you ticked it
  before the script loaded. Without the tick, no guest is saved.
- Below the note, "N of 200 characters" counts what is in the note, including text typed before
  the script loaded.
- Each **Reply** saves one reply.
