# 108. Photo album

The Photo album page uploads a whole folder of photos. `GET /api/s/:id/album` returns the
uploaded album as `{ photos: [{ path, size }] }`.

**Requirements to test:**

- After the user chooses a folder, the page lists every photo in it and in its subfolders, by
  its path inside the chosen folder (for example `day1/beach.jpg`), sorted by path, with the
  number of photos and their total size.
- Photos with the same name in different subfolders are all kept.
- Hidden files and anything inside hidden folders (names starting with a dot) are ignored. Other
  files that are not photos (.jpg, .jpeg, .png, .gif, .webp, .heic) are listed as left out.
- A folder with no photos says "No photos in this folder."
- Choosing another folder replaces the list.
- **Upload album** replaces the album on the server with exactly the listed photos, with the same
  paths and sizes, and says "Album uploaded."
