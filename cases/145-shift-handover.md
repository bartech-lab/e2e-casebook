# 145. Shift handover

The Shift handover page sends a note to the next shift. Five people can be mentioned: Ola Nowak
(1), Łukasz Wiśniewski (2), Marek Olszewski (3), Anna Łęcka (4) and Piotr Zieliński (5).
`GET /api/s/:id/handover` lists the notes as `{ "notes": [{ "text": "...", "mentions": [1, 4] }] }`.
**Requirements to test:**

- Typing `@` at the start or after a space opens a list named "People". The letters after it
  keep the people whose first or last name starts with them, ignoring case and Polish letters
  (`luk` finds Łukasz). An `@` inside a word, as in an email address, opens nothing.
- Up and Down move through the list, and screen readers follow the highlighted person. Enter,
  Tab or a click puts "@Full Name " where you were typing, also in the middle of the text, and
  leaves the cursor after it. Escape closes the list and changes nothing.
- **Send handover** saves the note with the people mentioned in it. A mention whose text you
  deleted is not saved.
