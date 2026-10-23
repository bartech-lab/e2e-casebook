# 40. Price filter

The Price filter page shows products between a lowest and a highest price, chosen with a slider
that has two handles.

**Requirements to test:**

- Prices go from 0 to 500 PLN in steps of 10. Dragging a handle picks the step nearest the
  pointer, and dragging past an end stops at 0 or 500.
- With a handle focused, the arrow keys move it by 10, Page Up and Page Down by 100, and Home and
  End jump to the ends.
- The lowest price is never above the highest.
- The list shows every product whose price is in the range, both ends included.
- The range is kept in the address (`?min=100&max=300`), so a copied link opens the same range.
