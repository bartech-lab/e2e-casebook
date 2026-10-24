# 150. Site photos

The Site photos page lists the folders and photos of a house renovation in a table with Name,
Size and Modified columns. It starts sorted by name, A to Z. There is no server. What it requires:

- Names sort the way people read them: numbers by their value ("Room 9" before "Room 10"), and
  capitals and accents make no difference ("room 3" sits between "Room 2" and "Room 9").
- Folders always come before files, in both directions. Folders have no size: sorted by Size,
  they stay A to Z by name.
- Size sorts by the number of bytes, and Modified by the date.
- Rows with the same size or date are ordered by name, A to Z, in both directions.
- Clicking the sorted column's header reverses it. Clicking another column sorts by it, A to Z
  or smallest and oldest first.
- The sorted column's header tells screen readers its direction.
- A new folder appears in its sorted place, dated today. A name already used, ignoring capitals
  and accents, is refused with "Something called <name> already exists."
