# 133. Field notes

The Field notes page keeps one set of notes in the browser's local storage, for use without a
connection.
**Requirements to test:**

- Notes are saved in this browser shortly after you stop typing, without leaving the field, and
  the page then says "Saved in this browser." A reload shows them again.
- If the browser's storage is full, the page says so ("This browser's storage is full, so your
  latest changes are not saved here. …"), never says "Saved", and keeps everything typed in the
  field. **Save again** saves once there is space; typing after space was freed saves as usual.
- If the browser does not allow the page to keep anything (storage blocked), the page still
  works and says "Notes cannot be kept in this browser, so they will be lost when you leave the
  page."
