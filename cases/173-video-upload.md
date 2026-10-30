# 173. Video upload

The Video upload page sends a video of up to 50 MB in parts of 1 MB. `POST /api/s/:id/video-uploads` with `{ "name", "size" }` starts an upload; `PATCH /api/s/:id/video-uploads/:upload` sends the bytes from the `Upload-Offset` header on and answers the new offset; `GET` on the same path answers how many bytes the server has. A part sent from the wrong offset gets `409` with the server's offset. `GET /api/s/:id/video-uploads` lists the finished videos with a SHA-256 of their bytes.

The test hook `POST /__test__/s/:id/video-upload-faults` with `{ "faults": [{ "part": 2, "after": false }] }` breaks the connection on the 2nd `PATCH` from then on, before the server keeps the part; with `"after": true` the server keeps the part and then answers `500`. `GET /__test__/s/:id/video-upload-received` answers how many bytes all `PATCH` requests carried.

**Requirements to test:**

- The page shows the progress ("Uploaded 2.0 of 5.0 MB") while it sends, and lists the video when it is done. The server keeps exactly the bytes of the file.
- When the connection breaks or the server fails, the page says "Connection lost. Resuming…" and carries on from the offset the server has, without starting over.
- **Pause** stops sending after the current part; **Resume** carries on.
- After a reload, choosing the same file again (same name and size) carries on where it stopped instead of starting over.
