# 185. Quick invoice

The Quick invoice page writes an invoice: a customer, lines with an item and a quantity (two to start with, **Add line** and **Remove** on each), and notes. **Save invoice** sends it to `POST /api/s/:id/quick-invoices`; `GET` on the same path lists the saved invoices.

**Requirements to test:**

- Enter in any one-line field (customer, item, quantity) saves the invoice, exactly like **Save invoice**. It never removes or adds a line.
- Enter in **Notes** starts a new line in the notes and saves nothing.
- **Add line** and **Remove** change the lines and save nothing.
- Saving sends the customer, the lines that have an item, with their quantities, and the notes, and says "Invoice <n> saved." Without a customer or any item it says "Add a customer and at least one line." and sends nothing.
