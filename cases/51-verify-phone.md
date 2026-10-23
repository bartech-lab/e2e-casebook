# 51. Verify phone

The Verify phone page texts a code (nothing is really sent). The server allows one code every 30
seconds and answers `429` with `Retry-After` otherwise. The test hook
`POST /__test__/s/:id/sms-clock` with `{ advanceMs }` moves one sandbox's server clock forward.

**Requirements to test:**

- After a code is sent, the button counts down "Resend in N s" from 30 and cannot be pressed.
  At 0 it says **Resend code** and works again.
- If the server says to wait, the page counts down exactly as long as `Retry-After` says.
- The countdown continues after a reload.
