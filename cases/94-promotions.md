# 94. Promotions

The Promotions page shows four offers in a carousel.

**Requirements to test:**

- The carousel shows the next offer every 5 seconds, and the first again after the last.
- It does not change while the pointer is over it or keyboard focus is inside it. It starts
  again when both have left.
- **Pause slides** stops it until **Play slides**, also after the pointer or focus leaves.
- When the device asks for reduced motion, it starts paused and the button says **Play slides**.
- **Previous slide** and **Next slide** move one offer, wrapping at both ends.
- Screen readers are not interrupted by automatic changes, but hear the new offer after Previous
  or Next while it is stopped.
