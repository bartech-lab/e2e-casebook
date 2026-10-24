# 127. Choir sign-up

The Choir sign-up page has three sections: About you (name, email, voice), Food (three boxes) and
Anything else (notes). Below 600 CSS px wide, it shows one section at a time with **Back** and
**Next**; from 600 px up, it shows all three side by side. **Sign up** sends the form and shows
"Thanks, <name>. Voice: <voice>. Food: <ticked boxes>. Notes: <notes>."
**Requirements to test:**

- The layout follows the window as it changes: turning a phone, or resizing a window across 600
  px, switches it without a reload.
- Switching layouts keeps everything entered: text, the chosen voice, ticked boxes and notes,
  including text in the field being edited.
- Focus stays in the same field, with the cursor where it was, when the layout switches. In the step-by-step layout, the step
  shown is the one with the focused field, or else the step you were on.
- **Sign up** gives the same result in both layouts.
