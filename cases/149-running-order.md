# 149. Running order

The Running order page lists the 30 acts of a village show, from "Brass band" to "Finale", in a
box that shows about eight at a time. `GET /api/s/:id/running-order` returns the saved order.
What it requires:

- Drag an act by its handle and let go: the act goes where the blue line showed, and the page
  says "<act> is now number <n> of 30."
- Holding the dragged act near the top or bottom edge of the box scrolls the box, also when the
  pointer stays still, so an act can be moved anywhere, including to the very end.
- The act lands where the line is when you let go, however far the box has scrolled.
- Scrolling stops when you let go. Escape during a drag puts everything back.
- The order is saved: a reload shows it.
