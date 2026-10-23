import { useRef, useState, type ChangeEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { json } from '../http.ts';

type Upload = { name: string; size: number; sha256: string };
const LIMIT = 20 * 1024 * 1024;
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function UploadPage({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const key = ['uploads', sandbox];
  const base = `/api/s/${sandbox}/uploads`;
  const uploads = useQuery({ queryKey: key, queryFn: async () => json<Upload[]>(await fetch(base)) });
  const xhr = useRef<XMLHttpRequest | null>(null);
  const [progress, setProgress] = useState<{ loaded: number; total: number } | null>(null);
  const [status, setStatus] = useState('');

  function start(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > LIMIT) return setStatus('Files can be at most 20 MB.');
    const request = new XMLHttpRequest();
    xhr.current = request;
    request.open('PUT', `${base}/${encodeURIComponent(file.name)}`);
    request.setRequestHeader('content-type', 'application/octet-stream');
    request.upload.onprogress = (p) => {
      if (p.lengthComputable) setProgress({ loaded: p.loaded, total: p.total });
    };
    const finish = (message: string) => {
      xhr.current = null;
      setProgress(null);
      setStatus(message);
      void client.invalidateQueries({ queryKey: key });
    };
    request.onload = () => {
      if (request.status === 201) finish(`Uploaded ${file.name}.`);
      else finish((JSON.parse(request.responseText || '{}') as { error?: string }).error ?? 'Upload failed.');
    };
    request.onerror = () => finish('Upload failed. Check your connection.');
    request.onabort = () => finish('Upload cancelled.');
    setStatus(`Uploading ${file.name}…`);
    setProgress({ loaded: 0, total: file.size });
    request.send(file);
  }

  return (
    <section>
      <h1>Upload</h1>
      <p>
        <label>
          Choose a file (up to 20 MB) <input type="file" onChange={start} disabled={progress !== null} />
        </label>
      </p>
      {progress && (
        <p>
          <progress aria-label="Upload progress" max={progress.total} value={progress.loaded} /> {mb(progress.loaded)} of {mb(progress.total)}{' '}
          <button type="button" onClick={() => xhr.current?.abort()}>
            Cancel upload
          </button>
        </p>
      )}
      <p role="status">{status}</p>
      <h2>Your files</h2>
      <ul aria-label="Your files">
        {uploads.data?.map((u) => (
          <li key={u.name}>
            {u.name}, {mb(u.size)}
          </li>
        ))}
      </ul>
    </section>
  );
}
