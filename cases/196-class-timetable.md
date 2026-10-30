# 196. Class timetable

The Class timetable page shows this month as a grid of weeks, with **Previous month** and **Next month**. It follows the browser's language and region (`navigator.language`): the week starts on Monday in Poland, on Sunday in the United States and on Saturday in Egypt, and the weekend is Saturday and Sunday, or Friday and Saturday in Egypt. There is no server.

**Requirements to test:**

- The first column is the first day of the week where the visitor lives, and the column headings are the weekday names in their language.
- Every date is in the column of its weekday, and the grid has as many rows as the month needs (up to six).
- Weekend columns are shaded (class `weekend`).
- Today is marked with `aria-current="date"`.
