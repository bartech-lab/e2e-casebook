import { useState, type ClipboardEvent, type FormEvent } from 'react';
import { sendJson } from '../http.ts';

type Attachment = { name: string; type: string; size: number; url: string };
const MAX = 3;
const TYPES = ['image/png', 'image/jpeg'];
const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export function Ticket({ sandbox }: { sandbox: string }) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [message, setMessage] = useState('');
  const [pasted, setPasted] = useState(0);

  async function onPaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    const files = [...e.clipboardData.files];
    if (files.length === 0) return;
    e.preventDefault();
    const next = [...attachments];
    let count = pasted;
    for (const file of files) {
      if (!TYPES.includes(file.type)) {
        setMessage('Only PNG or JPEG images can be attached.');
        continue;
      }
      if (next.length >= MAX) {
        setMessage('Attach at most 3 images.');
        break;
      }
      count++;
      next.push({ name: `Pasted image ${count}.${file.type === 'image/png' ? 'png' : 'jpg'}`, type: file.type, size: file.size, url: await readAsDataUrl(file) });
    }
    setPasted(count);
    setAttachments(next);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/s/${sandbox}/tickets`, sendJson('POST', { text, images: attachments.map((a) => a.url) }));
    const body = (await res.json()) as { error?: string };
    setMessage(res.ok ? 'Ticket sent.' : (body.error ?? 'Something went wrong.'));
  }

  return (
    <section>
      <h1>Support ticket</h1>
      <form onSubmit={submit}>
        <label>
          Describe the problem
          <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} onPaste={onPaste} />
        </label>
        <p className="hint">Paste a screenshot into the box to attach it (PNG or JPEG, up to 3).</p>
        <ul aria-label="Attachments" className="attachments">
          {attachments.map((a, i) => (
            <li key={a.name}>
              <img src={a.url} alt={a.name} width={64} height={48} /> {a.name}, {kb(a.size)}{' '}
              <button type="button" aria-label={`Remove ${a.name}`} onClick={() => setAttachments(attachments.filter((_, k) => k !== i))}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        {message && <p role="status">{message}</p>}
        <button type="submit">Send ticket</button>
      </form>
    </section>
  );
}
