# 171. Staff guide

The Staff guide page is one long page of six sections, with a **Contents** bar that stays at the top while you scroll. There is no server.

**Requirements to test:**

- Contents marks the section you are reading (`aria-current="location"`): the last section whose heading has reached the bar. The mark follows as you scroll.
- Clicking a section in Contents scrolls smoothly to it, marks it, moves keyboard focus to its heading, and puts `#<section>` in the address. The mark goes straight to that section; it does not pass through the sections scrolled past on the way.
- Clicking the section you are already at does the same, and afterwards the mark still follows when you scroll.
- Opening the page with `#<section>` in the address shows that section, marked.
