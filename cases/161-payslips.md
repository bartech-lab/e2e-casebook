# 161. Payslips

The Payslips page links to a separate site, `/embed/pay/<sandbox id>/`, made of ordinary server pages: a sign-in form (users `alice` and `bob`, password `payday`), the payslips of the signed-in person, and a sign-out button. The test hook `POST /__test__/s/:id/payslip` with `{ "user": "alice", "month": "October 2026", "net": "6,410.00 PLN" }` adds a payslip.

**Requirements to test:**

- Signing in shows that person's payslips, with "Signed in as <name>". The payslips page without a session goes to the sign-in form.
- After **Sign out**, going back with the browser's Back button (or Forward after that) never shows payslips; the person sees the sign-in form instead.
- After someone else signs in in the same browser, Back never shows the previous person's payslips.
- Coming back to the payslips page with Back or Forward while still signed in shows the current list, including payslips added since the page was first shown.
- Wrong names or passwords say "Wrong name or password."
