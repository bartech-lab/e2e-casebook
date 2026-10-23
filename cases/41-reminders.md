# 41. Reminders

The Reminders page reminds you about something in 1, 5, 15 or 60 minutes.

**Requirements to test:**

- It asks for permission to show notifications only when you press **Remind me**, never on its
  own.
- When the time comes, a system notification titled "Reminder" shows your text. If notifications
  are blocked, the page shows "Reminder: <your text>" instead.
- A reminder never fires early, and a cancelled reminder never fires.
- Pending reminders survive a reload of the page.
