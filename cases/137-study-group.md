# 137. Study group

The Study group page is a group chat for everyone in the sandbox. Below the messages it shows who
else is typing. The test hook `GET /__test__/s/:id/typing-signals` returns `{ "signals": n }`, how
many "I am typing" signals the server has received.
**Requirements to test:**

- While someone else types, you see "Ola is typing…"; for two people "Ola and Marek are typing…";
  for three or more "Several people are typing…". You never see yourself.
- It stays while they keep typing, however long.
- It goes 2 to 3 seconds after their last keystroke. It goes at once when they send, empty the box, or
  close the page.
- Typing sends at most one signal per second, not one per key.
- Sent messages appear for everyone, in order.
