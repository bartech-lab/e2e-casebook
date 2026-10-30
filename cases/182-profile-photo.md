# 182. Profile photo

The Profile photo page turns a chosen photo into a square profile photo in the browser and sends it with `PUT /api/s/:id/avatar` as a PNG; `GET` on the same path answers the saved PNG.

**Requirements to test:**

- The saved photo is 256 × 256 pixels, cut from the middle of the photo: the longer side loses the same amount at both ends, and nothing is squashed.
- **Rotate right** turns the photo a quarter turn clockwise before it is cut; four turns give the original. The preview shows the photo as it will be saved.
- A photo smaller than 256 pixels on its shorter side is refused with "The photo must be at least 256 × 256 pixels." A file that is not a picture is refused with "That file is not a picture."
- **Save photo** says "Profile photo saved." and shows the saved photo.
