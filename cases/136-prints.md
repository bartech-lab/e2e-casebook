# 136. Prints

The Prints page brings in photos from CloudPix, a pretend photo service. **Connect CloudPix**
opens CloudPix's sign-in in a pop-up window served from `/embed/cloudpix/`, which asks
"Allow" or "Deny" and answers the page with `postMessage`. The page then trades the one-time code
it got for the account (`POST /api/s/:id/cloudpix/token`). The test hook
`GET /__test__/s/:id/cloudpix-exchanges` returns `{ "exchanges": n }`, how many codes were traded.
**Requirements to test:**

- **Allow** closes the pop-up and shows "Connected as alice@cloudpix.test." and the three photos.
- **Deny** closes the pop-up and says "CloudPix was not connected."; you can try again.
- Closing the pop-up yourself puts the page back the way it was, without a lasting "Waiting".
- **Connect CloudPix** while the pop-up is open brings that pop-up forward; it never opens a
  second one.
- If the browser blocks the pop-up, the page says "Allow pop-ups for this site, then try again."
- Every connection trades exactly one code, also after earlier tries were denied or closed.
- Only the pop-up the page opened can connect it; a message from any other window is ignored.
