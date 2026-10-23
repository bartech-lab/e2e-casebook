# 74. Timesheet

The Timesheet page is a grid of hours per day and project.

**Requirements to test:**

- The grid is one stop for Tab. Inside it, the arrow keys move one cell and stop at the edges;
  Home and End go to the start and end of the row, Ctrl+Home and Ctrl+End to the corners. Tab
  back into the grid returns to the cell you left.
- Enter, F2 or a double-click edits a cell; typing a digit replaces its value. Enter saves and
  moves down; Escape cancels.
- Hours are whole numbers from 0 to 24. The totals follow every change.
