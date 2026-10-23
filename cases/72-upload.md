# 72. Upload

The Upload page sends a file of up to 20 MB to the server.

**Requirements to test:**

- A progress bar shows how much has been sent, as it is sent.
- **Cancel upload** stops sending, and the server keeps nothing of a cancelled file.
- A file over 20 MB is refused at once, without sending it. The server refuses one too.
- The list shows each file with its exact name and size, and the server keeps the exact bytes.
