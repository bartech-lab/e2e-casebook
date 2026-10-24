# 131. Guestbook

The Guestbook is a plain HTML page at `/api/s/:id/guestbook`, built by the server, with a form
that sends your name and a message. It does not need JavaScript. The Guestbook page of the app
links to it.
**Requirements to test:**

- Signing adds your entry at the top of "Signed so far" and shows "Thank you for signing."
- Reloading the page after signing, or going Back and then Forward, never adds the entry again and
  never asks to send the form again. "Thank you for signing." shows only once: a reload removes it.
- A missing name or message shows the form again with "Enter your name." or "Enter a message.",
  keeping what was typed, and adds nothing.
- Entries are shown exactly as typed: text that looks like HTML is shown as text, not run.
- All of this works with JavaScript turned off.
