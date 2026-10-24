# 93. Files tree

The Files tree page shows folders and files in a tree. All folders start closed. What it
promises:

- The tree follows the WAI-ARIA tree view pattern, and only one item is in the Tab order.
- Down and Up move through the items you can see, never into a closed folder. Home and End go
  to the first and last item you can see.
- Right opens a closed folder, or moves into an open one. Left closes an open folder, or moves
  to the parent of a file or a closed folder.
- Typing a letter moves to the next item you can see whose name starts with it.
- Enter, or a click, selects an item and the page says "Selected: " and its path. A click on a
  folder also opens or closes it.
- Screen readers hear whether each folder is open and how deep each item is.
