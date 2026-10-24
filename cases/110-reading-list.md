# 110. Reading list

The Reading list page shows a user's books after they sign in as `ola@example.com` with the
password `pierogi-2026`. The session is kept in the browser's IndexedDB, and
`GET /api/s/:id/reader/me` with the header `Authorization: Bearer <token>` says whose it is. The
test hook `POST /__test__/s/:id/reader-expire` ends every session of the sandbox on the server.
**Requirements to test:**

- A wrong password shows "Wrong email or password." and signs nobody in.
- After signing in, the user stays signed in across reloads and in new tabs.
- **Sign out** ends the session on the server too, removes it from the browser, and shows the
  sign-in form without any message.
- If the server has ended the session, the next visit shows the sign-in form with "Your session
  has ended. Sign in again." and never the books.
