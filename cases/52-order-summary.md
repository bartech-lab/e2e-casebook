# 52. Order summary

The Order summary page can be shown in English or Arabic.

**Requirements to test:**

- In Arabic, the whole page reads right to left (`dir="rtl"`, `lang="ar"` on the page), every
  label is in Arabic, numbers and the date use Arabic-Indic digits, and the arrow on **Pay now**
  points left.
- In Arabic, the buttons line up from the right edge, as the text does.
- The language you chose is kept after a reload. Other pages stay left to right.
