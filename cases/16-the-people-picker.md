# 16. The People picker

The split page chooses the number of people with a list built from ARIA roles, not a native
select.

**Requirements to test:**

- A click on the People button opens the list. With the button focused, Enter, Space, or the Down
  arrow opens it too.
- In the open list, Up and Down move the highlight. Enter or a click chooses an option and closes
  the list.
- Escape closes the list without changing the number.
