# 83. Change password

The Change password page changes the password of alice@example.com. The password starts as
`Blue-Kettle-42` in every sandbox.

**Requirements to test:**

- A password manager can fill the current password, and can offer and save a new one for the
  right account.
- You can paste into every password field, and nothing you type or paste is cut short or
  changed. Spaces count.
- The new password needs at least 12 characters, where an emoji counts as one, and it must
  differ from the current one. Both new password fields must match.
- A wrong current password is refused, also when the request does not come from the page.
- **Show** reveals a password and says that it is shown. Clicking it keeps the cursor where it
  was in the field, so you can keep typing.
- After a change, "Password changed." appears, the fields are empty, and only the new password
  works.
