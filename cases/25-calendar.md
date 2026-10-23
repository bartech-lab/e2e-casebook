# 25. Calendar

The Calendar page connects a calendar from Example Calendar, a separate sign-in service.

**Requirements to test:**

- **Connect calendar** opens Example Calendar's sign-in window. **Allow** closes the window and the
  page shows "Calendar: connected as calendar@example.test". A reload keeps the connection.
- **Deny**, or closing the window, leaves the calendar not connected, and the page says
  "Calendar not connected."
- The page accepts an answer only from the sign-in window it opened for this attempt.
- **Disconnect** removes the connection, also after a reload.
- Each sign-in connects once: its code cannot be used again.
