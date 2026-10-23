# 8. Magic-link sign-in

The Account page signs you in with a link sent by email. Mail never leaves the app: every sandbox
has a test inbox on the Mail page and at `GET /api/s/:id/mail`.

**Requirements to test:**

- The link signs you in once; a used or expired link does not, and says so.
- A session belongs to one sandbox, and Sign out ends it.
