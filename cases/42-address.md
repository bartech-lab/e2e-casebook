# 42. Address

The Address page edits your street, city and postcode. **Save** keeps them in this browser.

**Requirements to test:**

- With unsaved changes, following a link in the app asks **Leave without saving?** **Stay** keeps
  you and your changes on the page; **Leave** goes where the link pointed.
- With unsaved changes, reloading or closing the tab makes the browser ask before leaving.
- With no unsaved changes, nothing asks, including after you save and after you change a field
  back to its saved value.
