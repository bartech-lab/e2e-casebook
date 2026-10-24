import { useEffect, useState } from 'react';

type Photo = { path: string; size: number };
const IMAGE = /\.(jpe?g|png|gif|webp|heic)$/i;
const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

export function FolderUpload({ sandbox }: { sandbox: string }) {
  const url = `/api/s/${sandbox}/album`;
  const [chosen, setChosen] = useState<Photo[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [album, setAlbum] = useState<Photo[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void fetch(url)
      .then((r) => r.json() as Promise<{ photos: Photo[] }>)
      .then((b) => setAlbum(b.photos));
  }, [url]);

  function choose(files: FileList | null) {
    const photos: Photo[] = [];
    const left: string[] = [];
    for (const file of Array.from(files ?? [])) {
      const path = file.webkitRelativePath.split('/').slice(1).join('/') || file.name;
      const hidden = path.split('/').some((part) => part.startsWith('.'));
      if (hidden) continue;
      if (IMAGE.test(file.name)) photos.push({ path, size: file.size });
      else left.push(path);
    }
    photos.sort((a, b) => a.path.localeCompare(b.path));
    left.sort((a, b) => a.localeCompare(b));
    setChosen(photos);
    setSkipped(left);
    setMessage(photos.length ? '' : 'No photos in this folder.');
  }

  async function upload() {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ photos: chosen }) });
    if (!res.ok) return setMessage('Upload failed.');
    setAlbum(((await res.json()) as { photos: Photo[] }).photos);
    setChosen([]);
    setSkipped([]);
    setMessage('Album uploaded.');
  }

  const total = chosen.reduce((sum, p) => sum + p.size, 0);
  return (
    <section>
      <h1>Photo album</h1>
      <label>
        Choose a folder <input type="file" {...{ webkitdirectory: "" }} multiple onChange={(e) => choose(e.target.files)} />
      </label>
      {chosen.length > 0 && (
        <>
          <h2>
            {chosen.length === 1 ? '1 photo' : `${chosen.length} photos`}, {kb(total)}
          </h2>
          <ul aria-label="Chosen photos">
            {chosen.map((p) => (
              <li key={p.path}>{p.path}</li>
            ))}
          </ul>
          <button type="button" onClick={() => void upload()}>
            Upload album
          </button>
        </>
      )}
      {skipped.length > 0 && <p>Not photos, left out: {skipped.join(', ')}.</p>}
      <p role="status">{message}</p>
      <h2>Album</h2>
      <ul aria-label="Album">
        {album.map((p) => (
          <li key={p.path}>{p.path}</li>
        ))}
      </ul>
    </section>
  );
}
