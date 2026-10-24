# 130. Receipts

The Receipts page attaches receipts to an expense claim: files dragged from the computer onto the
drop area, or picked with **Or choose files**. PDF, JPG and PNG files (by their name's ending,
in any letter case) up to 5 MB (5,242,880 bytes) each are attached.
**Requirements to test:**

- While files are dragged over the drop area, it is highlighted and says "Drop the files to attach
  them", the whole time, also over the text and button inside it. It stops when the files leave
  or are dropped.
- Dropped or chosen files are listed under "Attached receipts" with their size. The same file
  twice is listed once.
- Other files are not attached; each is named with the reason: "<name> is not a PDF, JPG or PNG."
  or "<name> is larger than 5 MB."
- Files dropped anywhere else on the page are ignored: the browser does not open them and the page
  stays.
