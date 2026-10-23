# 56. Stay signed in

The Stay signed in page signs in `ann@example.test` with the password `correct horse`.

**Requirements to test:**

- Without **Remember me for 30 days**, closing the browser signs you out. With it, you stay
  signed in for 30 days, even after the browser is closed.
- Page scripts cannot read the sign-in cookie.
- A wrong password signs nobody in.
- **Sign out** ends the session on the server too: a copy of the old cookie no longer works.
