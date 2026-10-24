# 119. Expense claims

The Expense claims page lets `ewa@example.com` (password `kawa-z-mlekiem`) submit expense claims
in PLN. Ewa is an employee, so the server refuses to let her approve a claim. The test hook
`POST /__test__/s/:id/claims-expire` ends every session of the sandbox on the server, as if it
had timed out.
**Requirements to test:**

- A wrong password shows "Wrong email or password.", keeps the email, and empties the password.
- **Approve claim N** shows "Only managers can approve claims." and Ewa stays signed in.
- If the session has ended when Ewa submits a claim, a "Sign in again" dialog opens over the page
  and the claim she typed stays on the page.
- A wrong password in that dialog shows "Wrong email or password." in the dialog, which stays
  open.
- After signing in again, the claim is submitted exactly once, without pressing **Submit claim**
  again, and the dialog closes.
- **Sign out** shows the sign-in form.
