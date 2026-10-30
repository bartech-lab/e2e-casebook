# 188. Region packs

The Region packs page downloads a cycling map for Kraków, Gdańsk or Tatry from `GET /api/s/:id/region-packs/<region>` and shows a progress bar while the bytes arrive. Kraków is sent with its size (`Content-Length`). Gdańsk is sent compressed (`Content-Encoding: gzip`), so its `Content-Length` is the compressed size, not the size of the map. Tatry is sent without a size. The test hooks `POST /__test__/s/:id/region-pace` with `{ "ms" }` sets the pause between the 16 parts of a download, `POST /__test__/s/:id/region-cut` with `{ "region" }` cuts the next download of that region off halfway, and `GET /__test__/s/:id/region-stats` answers `{ "completed", "stopped" }`.

**Requirements to test:**

- While a download runs, the bar shows how far it has got, and it moves as the data arrives, not only at the end.
- When the page cannot know the size in advance, the bar has no value (it is busy, not 0%) and the text says how many MB have arrived.
- The bar never shows more than 100%.
- **Cancel download** stops the download on the server too, says "Download cancelled.", and saves nothing.
- A download that breaks off says "Download failed: <region>. Try again." and saves nothing.
- A finished pack is listed under **On this device** with its size.
