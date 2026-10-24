# 143. Rooms

The Rooms page shows the three rooms of a guest house, each with a photo, a name and a line of
text, below a decorative wave. Each photo exists 400, 800 and 1600 pixels wide, at
`/api/room-photos/<room>-<width>.png`.
**Requirements to test:**

- Each photo is sharp but no bigger than needed. On a desktop it is shown 400 CSS pixels wide:
  a normal screen loads the 400 file and a screen with 2 device pixels per CSS pixel loads the
  800 file. On a narrow screen it fills the page's content column, and the file is chosen for that
  width and the screen's pixel density.
- Each photo loads one file, not several.
- Space for each photo is kept from the start, so nothing below it moves when it arrives.
- Photos keep their shape (4:3); they are never stretched or squashed.
- Each photo has a text alternative that says what it shows. The wave is decoration and is not
  announced.
