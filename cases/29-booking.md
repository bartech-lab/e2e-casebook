# 29. Booking

The Booking page books a room in three steps: Dates, Guests, and Review.

**Requirements to test:**

- Each step has its own address: `/s/:id/booking/dates`, `/guests`, and `/review`. **Next** and
  **Back** move between steps, and so do the browser's Back and Forward buttons.
- A step keeps what you entered when you come back to it, also after a reload.
- Opening a step before the earlier steps are complete takes you to the first incomplete step.
- The price is 150.00 PLN per adult and 75.00 PLN per child, per night. Review shows the total.
- **Book** books once and shows "Booking BK-<n> confirmed." After that the wizard starts empty,
  and going back does not show the booked review again.
