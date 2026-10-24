# 85. Class list

The Class list page lists 15 pupils with Polish names in a table.

**Requirements to test:**

- The list is sorted by surname in Polish alphabetical order (a, ą, b, c, ć, ... l, ł, ... z, ź, ż),
  then by first name. Clicking **Surname** again reverses it.
- Clicking **Group** sorts by group number (Group 2 before Group 10), then by surname and first
  name. Clicking it again reverses the order.
- The header of the sorted column says which way it is sorted.
- **Find a pupil** matches part of a first name or surname with or without Polish letters, in
  any case: "lukasz" finds Łukasz and "ZRODLO" finds Źródło.
- The caption says how many pupils are shown.
