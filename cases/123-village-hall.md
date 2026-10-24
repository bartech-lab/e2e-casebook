# 123. Village hall

The Village hall page lists six questions about booking a hall. Each question is a button that
opens and closes its answer; every answer starts closed. Each answer has an address,
`/s/:id/village-hall#<answer id>`, for example `#faq-dogs`.
**Requirements to test:**

- A question's button opens and closes its answer, and says whether it is open (expanded).
- A closed answer can still be found with the browser's find in page, and opened by a link: to
  its address, to a piece of its text (a text fragment such as `#:~:text=Dogs%20on%20a%20lead`),
  or from a "See also" link in another answer. It then opens, and its question says it is open,
  so one click on the question closes it.
- Finding or linking to one answer leaves the others as they were.
- **Expand all** opens every answer and becomes **Collapse all**, which closes them all.
