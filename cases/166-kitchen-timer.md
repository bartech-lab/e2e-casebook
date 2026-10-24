# 166. Kitchen timer

The Kitchen timer page starts a 1, 3, 5 or 10 minute timer. Every tab of the page in the same browser shows the same timer. When it ends, the alarm rings: the ringing tab says "Ringing in this tab." and records the ring with `POST /api/s/:id/timer-rings`; `GET /api/s/:id/timer-rings` lists the rings as `{ "rings": [<end time in ms>] }`.

**Requirements to test:**

- A timer started in one tab shows in every open tab, counting down as `M:SS`, and survives a reload.
- When the time is up, every tab says "Time's up!", and the alarm rings exactly once, in one tab, however many tabs are open, also when the tab that started the timer was closed.
- **Stop** in any tab stops the timer in every tab: no tab rings, and they all say "No timer running."
- Starting a new timer replaces the old one in every tab; only the new one rings.
