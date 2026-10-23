# 17. Cookie consent

The Deals page asks for cookie consent before it shows deals picked for you. The banner is a
self-contained web component, like the consent widgets shops embed from a vendor.

**Requirements to test:**

- Until you choose, the banner is shown and the deals picked for you are off.
- **Accept all** closes the banner and shows the deals picked for you. **Only necessary** closes
  the banner and keeps them off.
- This browser remembers the choice: after a reload the banner stays closed and the deals stay as
  chosen.
- **Cookie settings** opens the banner again, and a new choice replaces the old one, after a
  reload too.
