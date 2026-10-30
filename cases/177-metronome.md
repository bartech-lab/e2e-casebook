# 177. Metronome

The Metronome page counts beats at a tempo from 40 to 208 beats per minute. There is no server.

**Requirements to test:**

- **Start** counts beats at the tempo shown ("Beats: 8" after four seconds at 120), from 0; **Stop** stops counting. Changing the tempo while it plays changes the speed, never adds a second beat.
- Space starts and stops it from anywhere on the page, and the up and down arrow keys change the tempo by 1. Keys pressed in the tempo field or on a button do only what they normally do there: Space on **Start** presses it once.
- Leaving the page stops it. Coming back shows it stopped, at the tempo it had. However often someone leaves and comes back, Space toggles once, an arrow key changes the tempo by 1, and the beats keep the tempo.
