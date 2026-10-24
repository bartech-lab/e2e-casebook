# 82. Mobile inbox

The Mobile inbox page lists 12 messages in a scrolling list.

**Requirements to test:**

- Swiping a message to the left by more than 40% of its width deletes it. A shorter swipe puts
  it back.
- Moving your finger mostly up or down scrolls the list and never deletes a message.
- Every message also has a **Delete** button, for people who cannot swipe.
- After a delete, "Message deleted." with **Undo** stays for 5 seconds. Undo puts the message
  back where it was.
