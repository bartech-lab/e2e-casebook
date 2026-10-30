# 200. Appointment reminders

The Appointment reminders page writes the text message a clinic sends before a visit. Phone networks send a message in GSM-7 when every character is in the GSM alphabet and in Unicode otherwise, and the page shows which, how many messages the text takes, and how many characters are left. There is no server.

**Requirements to test:**

- In GSM-7 one message holds 160 characters. The GSM alphabet includes letters such as é, à, Ä and ñ and the sign £. The characters `^ { } \ [ ] ~ | €` count twice.
- One character outside the GSM alphabet, such as ł, a curly apostrophe ’ or an emoji, makes the whole message Unicode, which holds 70 characters. An emoji counts twice.
- A longer text is split into parts of 153 characters (GSM-7) or 67 (Unicode), and the counter says how many messages it takes and how many characters are left in the last one.
- In Unicode the page names the characters that caused it, and **Replace with plain letters** swaps Polish letters, curly quotes, dashes and … for plain ones.
