# 103. Trip tags

The Trip tags page turns what the user types into tags. It starts with one tag, "Kyoto". What it
promises:

- Enter adds the typed text as a tag, without spaces around it, and empties the field. A comma
  does the same, so "Nara, Osaka," adds two tags.
- Pasting a list separated by commas or new lines adds one tag per item.
- An empty tag, or one that is already there, is not added. "osaka" is the same tag as "Osaka",
  and "café" is the same tag whether the accent was typed as one character or as two.
- Escape empties the field. Backspace in an empty field removes the last tag.
- While the user is composing text with an input method (for Japanese, Chinese, or accented
  letters), Enter and Escape belong to the input method: Enter confirms the characters and adds
  no tag, and Escape does not empty the field.
- The line under the field counts the tags.
