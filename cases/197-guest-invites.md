# 197. Guest invites

The Guest invites page takes many email addresses at once, separated by commas, semicolons, spaces or new lines, and adds the valid ones to the **Invited** list. There is no server.

**Requirements to test:**

- Real addresses get through, including ones with `+` or an apostrophe before the `@` (`ola+news@example.com`, `o'brien@example.ie`), a long ending (`kurator@muzeum.museum`), or letters outside English in the domain (`anna@żółw.pl`).
- The part after the `@` is shown in lower case; the part before it is kept as typed.
- An address already on the list is not added again, whatever its capital letters, and the page counts it: "Invited 2. Already on the list: 1."
- What is not an address (`ola@`, `ola@example`, `ola@@example.com`, `.ola@example.com`) is listed after "Not valid:" and left in the box to fix.
