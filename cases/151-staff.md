# 151. Staff

The Staff page lists five people at a café, each with an Edit button. Edit opens a dialog that
loads the person's details from the server; Next moves the dialog to the next person, and Save
stores the changes. `GET /api/s/:id/staff/:n` returns one person. The test hooks:
`POST /__test__/s/:id/staff-pace` with `{ "ms": [800, 0] }` makes the server wait 800 ms on the
first details request, 0 on the second, and so on in turn; `GET /__test__/s/:id/staff-writes`
lists the saves. What it requires:

- When the dialog opens, focus moves into it at once, before the details arrive.
- When the details arrive, the cursor goes to the Name field, unless you moved focus while
  waiting.
- The dialog always shows the person it says it shows, however late an earlier person's
  details arrive. Save stores the shown details for that person.
- Tab and Shift+Tab stay inside the dialog.
- Escape and Cancel close the dialog, also while it is loading, and put focus back on the Edit
  button that opened it.
- After a save, the list shows the new details, the page says "Saved <new name>.", and focus is
  back on that person's Edit button.
