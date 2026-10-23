# 11. Checkout total

The Shop page sells three products. Prices are in PLN.

**Requirements to test:**

- The code `SAVE10` takes 10.00 PLN off the subtotal, but never takes it below zero. Codes ignore
  letter case and surrounding spaces.
- VAT is 23% of the subtotal after the discount, rounded half up to the grosz (0.01 PLN).
- The total is the subtotal minus the discount, plus VAT. A placed order charges exactly the total
  shown in the summary.
