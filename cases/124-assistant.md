# 124. Assistant

The Assistant page has three conversations: Trip planning, Recipes and Taxes. In each, **Ask**
sends your question and the answer arrives word by word, streamed by
`POST /api/s/:id/assistant/ask`. The answer to a question Q is always
`About "Q": the full answer is in the members' handbook, chapter three, which the office can post
to you.` The test hook `POST /__test__/s/:id/assistant-pace` with `{ "ms": n }` sets the time
between words (120 ms by default).
**Requirements to test:**

- An answer always stays in the conversation where its question was asked, and keeps arriving
  while you read another conversation. It is complete when you come back.
- While a conversation is answering, its name in the list says "(answering…)" and its **Ask** is
  unavailable, while **Ask** in the other conversations still works.
- An answer that finished while you were in another conversation marks that conversation
  "(new answer)" until you open it.
- **Stop** ends the answer at once; what arrived so far stays, followed by "(stopped)".
