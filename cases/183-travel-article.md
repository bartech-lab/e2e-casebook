# 183. Travel article

The Travel article page shows an article with three photos from `GET /api/s/:id/travel-photos/<1-3>` (800 × 500, 800 × 600 and 800 × 450 pixels) and a newsletter box whose text comes from `GET /api/s/:id/newsletter-offer`.

**Requirements to test:**

- Nothing on the page moves while it loads, on narrow and wide screens: each photo has its space, in its own proportions, before it arrives, and so does the newsletter box before its text.
- A photo that cannot be loaded leaves its space and shows its description there.
