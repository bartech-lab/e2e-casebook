# 6. Due dates, time zones, and DST

Cards can have a due date. The board shows Overdue, Due today, Due tomorrow, or Due in N days.

**Requirements to test:**

- "Today" is the visitor's local calendar day, whatever the time zone.
- The count is in calendar days, also across a daylight-saving change.
- An open board updates when midnight passes.
