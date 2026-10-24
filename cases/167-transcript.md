# 167. Transcript

The Transcript page shows the 220 lines of a parish council meeting, loaded from `GET /api/s/:id/transcript`, under a header that stays at the top of the window while you scroll. Lines differ a lot in length. Every line has a link, **#**, to its own address, `/s/:id/transcript#line-<number>`, and the agenda at the top links to the first line of each item.

**Requirements to test:**

- Opening a line's address shows that line at the top of the reading area: its top edge just below the sticky header, not hidden under it and not further down. This holds for every line, the last ones included, as long as the page is long enough to scroll that far.
- The line the address points to is highlighted (and marked as the current line), and only that one.
- Clicking a line's **#** or an agenda link does the same, and changes the address.
- The page lands correctly although the lines arrive from the server after the page has opened.
