import { useLayoutEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import { json } from '../http.ts';

const LENGTH = 28;

export function clean(raw: string) {
  let out = '';
  for (const ch of raw.toUpperCase()) {
    if (out.length === LENGTH) break;
    if (out.length < 2 ? /[A-Z]/.test(ch) : /\d/.test(ch)) out += ch;
  }
  return out;
}

export const format = (compact: string) => compact.replace(/(.{4})(?=.)/g, '$1 ');
const caretAfter = (count: number) => (count === 0 ? 0 : count + Math.floor((count - 1) / 4));

export function validIban(compact: string) {
  if (!/^PL\d{26}$/.test(compact)) return false;
  const moved = compact.slice(4) + compact.slice(0, 4);
  const digits = moved.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let rest = 0;
  for (const d of digits) rest = (rest * 10 + Number(d)) % 97;
  return rest === 1;
}

export function BankTransfer({ sandbox }: { sandbox: string }) {
  const [account, setAccount] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const box = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (caret.current === null || !box.current) return;
    box.current.setSelectionRange(caret.current, caret.current);
    caret.current = null;
  });

  function update(compact: string, significantBefore: number) {
    caret.current = caretAfter(Math.min(significantBefore, compact.length));
    setAccount(compact);
    setError('');
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const { value, selectionStart } = e.target;
    update(clean(value), clean(value.slice(0, selectionStart ?? value.length)).length);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const el = e.currentTarget;
    const at = el.selectionStart ?? 0;
    if (e.key !== 'Backspace' || at !== el.selectionEnd || el.value[at - 1] !== ' ') return;
    e.preventDefault();
    const before = clean(el.value.slice(0, at)).length;
    update(account.slice(0, before - 1) + account.slice(before), before - 1);
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    setStatus('');
    if (!validIban(account)) {
      setError('Check the account number.');
      box.current?.focus();
      return;
    }
    const res = await fetch(`/api/s/${sandbox}/transfers`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ account }),
    });
    await json(res);
    setStatus(`Transfer to ${account.slice(0, 4)}…${account.slice(-4)} sent.`);
  }

  return (
    <section>
      <h1>Bank transfer</h1>
      <p>Send 100.00 PLN to a Polish bank account.</p>
      <form noValidate onSubmit={(e) => void send(e)}>
        <label>
          Account number{' '}
          <input
            ref={box}
            value={format(account)}
            onChange={onChange}
            onKeyDown={onKeyDown}
            inputMode="text"
            autoComplete="off"
            spellCheck={false}
            size={36}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'account-error' : undefined}
          />
        </label>
        {error && (
          <p id="account-error" className="field-error">
            {error}
          </p>
        )}
        <button type="submit">Send 100.00 PLN</button>
      </form>
      <p role="status">{status}</p>
    </section>
  );
}
