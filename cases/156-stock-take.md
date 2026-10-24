# 156. Stock take

The Stock take page has a grid of six products with Shelf and Back room counts and a Note. You
can type into each cell, or paste cells copied from a spreadsheet. There is no server. What it
requires:

- Pasting several cells (tabs between cells, line breaks between rows, as spreadsheets copy them)
  fills the grid from the cell you paste into, rightwards and downwards. Pasting one value is an
  ordinary paste into that cell.
- Whatever a spreadsheet puts on the clipboard works: Windows line breaks, the line break after
  the last row, and cells in quotes, which may hold tabs, line breaks and doubled quotes (`""`
  is one `"`).
- Counts are whole numbers, and may use a space or a non-breaking space between thousands
  (`1 234`). Anything else is marked as invalid and left out of the totals.
- The page says how many cells were pasted ("Pasted 6 cells."). Cells beyond the grid are left
  out, and the page says how many ("Pasted 4 cells. 2 did not fit.").
- The Total row adds up each count column.
