# 39. Invoices

The Invoices page lists two invoices with a **Download PDF** link each.

**Requirements to test:**

- The link downloads that row's invoice, named after its number (for example
  `INV-2026-0012.pdf`).
- The PDF shows the number, date, customer, every line, the net amount, VAT at 23% rounded to the
  nearest grosz, and the total, which is net plus VAT.
