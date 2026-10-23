# 1. Two-user realtime chat

Open a sandbox, join with a name, and send messages. Every page open in the same sandbox receives
them live over a WebSocket.

**Requirements to test:**

- Every user sees every message, once, in the order the server accepted them (`seq`).
- A page that loses its connection reconnects by itself and then shows the messages it missed.
- The connection state is shown on the page in `data-testid="connection"`, with a `data-state`
  attribute of `connecting`, `open`, or `closed`.
