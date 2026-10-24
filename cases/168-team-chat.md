# 168. Team chat

The Team chat page shows a team's messages in a scrolling box, oldest at the top. Some messages have photos, which load a moment after the text. The page checks for new messages every second. The test hook `POST /__test__/s/:id/team-chat` with `{ "from": "Ola", "text": "...", "image": { "height": 200 } }` (image optional, height in pixels) posts a message from someone else.

**Requirements to test:**

- Opening the page shows the newest message at the bottom of the box, fully visible, also once all photos have loaded.
- While you are at the bottom (within 40 px of it), new messages, and their photos when they load, keep the newest message fully visible at the bottom.
- When you have scrolled up, new messages from others never move what you are reading. A button says "1 new message ↓" or "N new messages ↓"; it scrolls to the bottom and goes away. Scrolling back to the bottom yourself also removes it.
- Sending a message always shows it at the bottom, also when you had scrolled up.
