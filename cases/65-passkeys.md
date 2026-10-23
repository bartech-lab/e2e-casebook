# 65. Passkeys

The Passkeys page creates passkeys for ann and signs in with them.

**Requirements to test:**

- A device holds at most one passkey for ann. Cancelling says so and leaves everything as it was.
- Only a passkey the server knows signs you in. A removed passkey no longer works.
- The server checks every sign-in: the page it came from, a fresh challenge used once, the
  signature, and a counter that only goes up, so a copied passkey is caught.
- Where passkeys cannot work, the page says why.
