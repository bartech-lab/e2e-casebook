# 78. Statement

The Statement page lists a month of bank transactions and downloads them with **Download CSV**.

**Requirements to test:**

- The download is a file named `Wyciąg <month>.csv`, for example `Wyciąg 2026-10.csv`, for the month
  that is chosen.
- Spreadsheet apps open it with Polish letters intact.
- Every transaction is one row, with its date, description and amount, even when the description
  has commas, quotes or a line break. The last row is the total.
- A description is never run as a formula when the file is opened in a spreadsheet.
- A month runs from midnight to midnight Warsaw time, in the list and in the file.
- The total is exact to the grosz.
