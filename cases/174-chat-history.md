# 174. Chat history

The Chat history page shows a long conversation with Ola, 95 messages, in a box that scrolls. `GET /api/s/:id/chat-history?before=<id>` answers the 20 messages before that one, oldest first, with `"more": false` at the start of the conversation; without `before`, the newest 20. The test hook `POST /__test__/s/:id/chat-history-fail` with `{ "times": 1 }` makes the next loads fail.

**Requirements to test:**

- The conversation opens at the newest message, at the bottom.
- Scrolling up near the top loads the 20 older messages above. The messages you were reading stay exactly where they were on the screen: the view does not jump, wherever the scroll was when the load started.
- Every message appears once, in order, and the top says "Start of the conversation" once all are there.
- When loading fails, the top says "Could not load older messages." with **Try again**, and the messages shown stay.
