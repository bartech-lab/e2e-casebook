# 159. Phrasebook

The Phrasebook page keeps a list of phrases in this browser. People type Chinese, Japanese or Korean with an input method (IME): the letters they type are a composition, and Enter or Space picks the characters to commit. Accented letters typed with dead keys are compositions too. There is no server.

**Requirements to test:**

- Enter adds the phrase in the field, and **Add** does the same. Spaces at either end are dropped, and an empty phrase is never added.
- The Enter that picks characters in an input method never adds the phrase, and Escape while composing does not clear the field. Browsers differ: Chrome sends that Enter during the composition, Safari right after it ends. Both count as picking.
- Only the committed text is added, exactly once: never the letters typed before picking, never twice.
- The counter under the field shows characters as people see them, out of 40: `é`, `你` and `👍🏽` each count as one, however the browser stores them. Over 40, the counter turns red and the phrase cannot be added, but nothing typed is ever cut off.
- A phrase that is already in the list, also when written with different but equal Unicode (a precomposed `é` or `e` with a combining accent), is not added again; the page says `"<phrase>" is already in your phrasebook.`
- Escape (when not composing) clears the field. The list stays after a reload.
