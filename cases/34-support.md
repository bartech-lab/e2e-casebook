# 34. Support

The Support page sends a message to support. It needs you to be signed in (case 8).

**Requirements to test:**

- The message you are writing is kept in the browser, also across a reload and a new sign-in, until
  it is sent.
- If your session has expired when you press **Send**, the page says "Your session has expired.
  Sign in again; your message is kept." and nothing is sent.
- After you sign in again, the message is still there, and **Send** sends it once. "Your messages"
  lists what you sent, and the message field is empty again.
