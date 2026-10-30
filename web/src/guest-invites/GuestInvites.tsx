import { useState, type FormEvent } from 'react';

const LOCAL = /^[^\s@"(),:;<>[\]\\]+$/u;
const LABEL = /^[\p{L}\p{N}](?:[\p{L}\p{N}-]{0,61}[\p{L}\p{N}])?$/u;
const TLD = /^\p{L}{2,}$/u;

function normalise(text: string): string | null {
  const at = text.lastIndexOf('@');
  if (at <= 0 || at === text.length - 1) return null;
  const local = text.slice(0, at);
  const domain = text.slice(at + 1);
  if (!LOCAL.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return null;
  const labels = domain.split('.');
  if (labels.length < 2 || !labels.every((l) => LABEL.test(l)) || !TLD.test(labels.at(-1)!)) return null;
  return `${local}@${domain.toLowerCase()}`;
}

const sameAddress = (a: string) => a.toLowerCase();

export function GuestInvites() {
  const [text, setText] = useState('');
  const [invited, setInvited] = useState<string[]>([]);
  const [invalid, setInvalid] = useState<string[]>([]);
  const [status, setStatus] = useState('');

  function invite(e: FormEvent) {
    e.preventDefault();
    const parts = text.split(/[\s,;]+/).filter(Boolean);
    const bad: string[] = [];
    const added: string[] = [];
    let repeated = 0;
    const seen = new Set(invited.map(sameAddress));
    for (const part of parts) {
      const address = normalise(part);
      if (!address) {
        bad.push(part);
      } else if (seen.has(sameAddress(address))) {
        repeated += 1;
      } else {
        seen.add(sameAddress(address));
        added.push(address);
      }
    }
    setInvited((list) => [...list, ...added]);
    setInvalid(bad);
    setStatus(`Invited ${added.length}.` + (repeated ? ` Already on the list: ${repeated}.` : ''));
    setText(bad.join('\n'));
  }

  return (
    <section className="guest-invites">
      <h1>Guest invites</h1>
      <form onSubmit={invite}>
        <label>
          Email addresses
          <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <p className="hint">Separate addresses with commas, semicolons, spaces or new lines.</p>
        <button type="submit">Invite</button>
      </form>
      <p role="status">{status}</p>
      {invalid.length > 0 && <p className="invite-errors">Not valid: {invalid.join(', ')}</p>}
      <h2>Invited</h2>
      <ul aria-label="Invited">
        {invited.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </section>
  );
}
