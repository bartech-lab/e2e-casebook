# 21. Your plan

The Plan page shows your Pro plan, 49.00 PLN a month, with the next payment on 1 December 2026.

**Requirements to test:**

- **Cancel plan**, then confirming, stops the payments. You keep Pro until 1 December 2026: the
  page shows "Active until 1 December 2026" and no next payment. **Keep plan** changes nothing.
- **Pause plan**, then confirming, skips the December payment: the next payment is 1 January 2027.
- **Resume plan** undoes a cancel or a pause.
- The page shows the same plan after a reload.
