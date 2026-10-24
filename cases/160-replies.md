# 160. Replies

The Replies page lists five customer conversations. Pick one to read it and write a reply. Unsent replies are kept in this browser's local storage as drafts, one per conversation. There is no server.

**Requirements to test:**

- Each conversation keeps its own draft. Switching to another conversation and back, reloading, closing the tab, or the tab being hidden (switching apps on a phone) keeps everything typed, up to the last letter, even right after typing it.
- A conversation with a draft shows "Draft" next to its name within a second of typing, also when the draft was written in another tab. Spaces alone are not a draft.
- **Send** adds the reply under the conversation, empties the field and removes the draft: no "Draft" mark, and a reload does not bring it back. Sent replies stay after a reload.
- **Archive** removes the conversation and its draft from the browser and opens the next conversation. Drafts left behind for a conversation archived in another tab are removed from local storage the next time the page opens.
