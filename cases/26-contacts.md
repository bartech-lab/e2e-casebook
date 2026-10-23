# 26. Contacts

The Contacts page imports contacts from a CSV file.

**Requirements to test:**

- Choose a file, or drop it on the page. The first row must be `name,email`. Each valid row
  after it adds a contact.
- Fields may be quoted. A quoted field may contain commas and doubled quotes (`""` is one `"`).
  Windows and Unix line endings both work.
- A row is skipped when its name is missing, its email is invalid, or the email is already a
  contact or appears earlier in the file. The page lists each skipped row by its number (the
  header is row 1) with the reason, and **Download error report** saves `errors.csv` with the
  columns `row,error`.
- The page says how many contacts it imported, and how many rows have errors.
