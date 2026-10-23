# 32. Vault

The Vault page keeps notes behind two-step verification with an authenticator app.

**Requirements to test:**

- **Turn on two-step verification** shows a secret key (base32). Codes follow RFC 6238: HMAC-SHA1
  over the key, 30-second steps, 6 digits, leading zeros kept. Entering a current code turns it on.
- To unlock the vault, enter a code. The code for the current step and for the steps just before
  and after it are accepted, each only once ("That code was already used. Wait for a new one.").
- A wrong code says "Wrong code." After 5 wrong codes in a row the vault refuses every code for 1
  minute ("Too many tries. Try again in 1 minute.").
