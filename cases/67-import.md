# 67. Import

The Import page imports 100 customers and shows the progress as it happens.

**Requirements to test:**

- The progress bar and the list of rows with errors follow the server, live.
- If the connection drops, the page reconnects by itself and carries on where it stopped: nothing
  is missed and nothing is shown twice.
- At the end, the page says how many rows were imported and stops listening.
