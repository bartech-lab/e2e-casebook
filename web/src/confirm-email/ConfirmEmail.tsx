import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { sendJson } from '../http.ts';

const LENGTH = 6;
const empty = () => Array<string>(LENGTH).fill('');

export function ConfirmEmail({ sandbox }: { sandbox: string }) {
  const base = `/api/s/${sandbox}/otp`;
  const [digits, setDigits] = useState(empty);
  const [message, setMessage] = useState('');
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  const [checking, setChecking] = useState(false);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  async function send() {
    await fetch(`${base}/send`, { method: 'POST' });
    setDigits(empty());
    setLocked(false);
    setMessage('');
    boxes.current[0]?.focus();
  }

  useEffect(() => {
    void send();
  }, []);

  useEffect(() => {
    if (checking || digits.some((d) => d === '')) return;
    setChecking(true);
    void (async () => {
      const res = await fetch(`${base}/verify`, sendJson('POST', { code: digits.join('') }));
      setChecking(false);
      if (res.ok) return setDone(true);
      setMessage(((await res.json()) as { error: string }).error);
      setDigits(empty());
      if (res.status === 429) setLocked(true);
      else boxes.current[0]?.focus();
    })();
  }, [digits]);

  function put(from: number, text: string) {
    const next = [...digits];
    let at = from;
    for (const c of text) {
      if (at >= LENGTH) break;
      next[at++] = c;
    }
    setDigits(next);
    boxes.current[Math.min(at, LENGTH - 1)]?.focus();
  }

  function onChange(i: number, value: string) {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[i] = '';
      return setDigits(next);
    }
    if (clean.length > 1 && digits[i] === '') return put(i, clean);
    put(i, clean.slice(-1));
  }

  function onPaste(e: ClipboardEvent) {
    e.preventDefault();
    put(0, e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH));
  }

  function onKeyDown(i: number, e: KeyboardEvent) {
    if (e.key === 'Backspace' && digits[i] === '' && i > 0) {
      e.preventDefault();
      const next = [...digits];
      next[i - 1] = '';
      setDigits(next);
      boxes.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) boxes.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < LENGTH - 1) boxes.current[i + 1]?.focus();
  }

  if (done)
    return (
      <section>
        <h1>Confirm your email</h1>
        <p role="status">Email confirmed.</p>
      </section>
    );

  return (
    <section>
      <h1>Confirm your email</h1>
      <p>We sent a 6-digit code to ann@example.test.</p>
      <div role="group" aria-label="Code" className="otp">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el;
            }}
            aria-label={`Digit ${i + 1} of ${LENGTH}`}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            value={d}
            disabled={locked || checking}
            onChange={(e) => onChange(i, e.target.value)}
            onPaste={onPaste}
            onKeyDown={(e) => onKeyDown(i, e)}
            onFocus={(e) => e.currentTarget.select()}
          />
        ))}
      </div>
      {message && <p role="alert">{message}</p>}
      <button type="button" onClick={() => void send()}>
        Send a new code
      </button>
    </section>
  );
}
