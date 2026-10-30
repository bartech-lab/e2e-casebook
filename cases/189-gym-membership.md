# 189. Gym membership

The Gym membership page lists the next four renewal dates for a start date (today by default) and a plan, Monthly or Yearly, and says how many days there are until the first renewal. Everything happens in the page; there is no server.

**Requirements to test:**

- A membership renews on the same day of the month as its start. In a shorter month it renews on that month's last day, and the month after that it is back on the start day (31 January gives 28 February, then 31 March).
- A yearly membership that starts on 29 February renews on 28 February, and on 29 February in leap years.
- The start date is today in the visitor's own time zone, even just after midnight.
- The dates and the day count are the same in every time zone, including across a change to or from summer time.
