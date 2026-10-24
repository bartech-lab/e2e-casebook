# 88. Announcements

The Announcements page shows three banners, each with a **Dismiss** button.

**Requirements to test:**

- **Dismiss** fades the banner out and then removes it from the page. The count above the
  banners goes down.
- When the device asks for reduced motion, the banner goes at once, without fading.
- After a dismissal, keyboard focus moves to the next banner's **Dismiss** button, or the
  previous one if it was the last, or the page heading when no banner is left.
- Dismissed banners stay dismissed after a reload in this browser.
