# 138. Billing details

The Billing details page saves who invoices are made out to. `GET /api/s/:id/billing` returns
what was saved as `{ "billing": { ... } }`, or `null`.
**Requirements to test:**

- **Buying as** a private person asks for a full name and an email. As a company it also asks for
  the company name and a VAT number. **Send invoices to a different email** adds an invoice email.
- Only the fields on screen are checked and saved. Saving as a private person saves no company
  name or VAT number, even if you typed them earlier; the same goes for the invoice email when
  the box is not ticked.
- What you typed in a field stays there if you hide it and show it again.
- A VAT number is "PL" and 10 digits. Spaces and dashes are allowed and are left out when saved.
- **Save billing details** with a problem lists every problem under "There is a problem", shows
  each one next to its field, and puts the cursor in the first field with a problem. Problems of
  fields that are no longer on screen are not listed.
- After saving, the page says "Billing details saved."
