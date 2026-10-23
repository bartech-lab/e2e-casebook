# 55. Holiday request

The Holiday request page picks a first and a last day, on a calendar or in the **From** and
**To** fields.

**Requirements to test:**

- Days before today cannot be picked. A holiday is at most 14 days, first and last day included.
- The page counts working days: Monday to Friday, without public holidays (6 April and 1 May
  2026), across month ends too.
- On the calendar, the arrow keys move by a day or a week, and Page Up and Page Down by a month,
  keeping the day of the month where it exists. Enter or Space picks the focused day.
- Picking a day before the first day starts again from that day.
