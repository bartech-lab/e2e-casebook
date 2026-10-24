# 132. Concert poster

The Concert poster page previews a poster with an editable headline. The page reports every
error the browser raises in it to `GET /api/s/:id/client-errors` (an error log, like an error
tracker would keep).
**Requirements to test:**

- The headline always fits on one line inside the poster, at the largest font size from 16 to 48
  px that fits: when the window gets narrower or wider, and when the headline is edited. A
  headline too long even at 16 px is cut at the poster's edge.
- When there is room again, the headline grows back.
- Using the page, resizing and editing included, adds nothing to the error log.
