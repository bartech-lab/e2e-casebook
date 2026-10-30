# 184. Paper boat

The Paper boat page plays a 12-second video, `/media/paper-boat.webm`, with captions in English and Polish from WebVTT files (`/media/paper-boat.en.vtt` and `.pl.vtt`). The page draws the captions itself, over the video, in the **Captions** area. There is no server.

**Requirements to test:**

- **Captions** chooses Off, English or Polski. The choice is kept for the next visit.
- The captions show the line for the current moment of the video, and nothing between lines; they follow seeking, also backwards.
- With captions on, the **Transcript** lists every line with its time. Clicking a line moves the video to that line, and the line being shown is marked (`aria-current`).
- Off clears the captions and the transcript at once.
