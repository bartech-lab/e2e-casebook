# 28. Quote

The Quote page multiplies a unit price by a quantity. It speaks the browser's language
(`navigator.language`).

**Requirements to test:**

- Type the unit price the way your language writes it: `12,50` in Polish, `12.50` in English.
  Up to 6 digits before the decimal separator and up to 2 after; `12,5` means 12.50 PLN.
- The quantity is a whole number from 1 to 99.
- The total is the exact price times the quantity, formatted as PLN with
  `Intl.NumberFormat` for the browser's language, grouping included.
- A price or quantity the page cannot read shows a hint ("Enter a price like 12,50." in Polish)
  and no total.
