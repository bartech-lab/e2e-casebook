import { useState, type ClipboardEvent, type KeyboardEvent } from 'react';

const key = (tag: string) => tag.normalize('NFC').toLocaleLowerCase();

export function TripTags() {
  const [tags, setTags] = useState<string[]>(['Kyoto']);
  const [text, setText] = useState('');

  function add(parts: string[]) {
    setTags((cur) => {
      const next = [...cur];
      for (const raw of parts) {
        const tag = raw.trim().normalize('NFC');
        if (tag && !next.some((t) => key(t) === key(tag))) next.push(tag);
      }
      return next;
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      add([text]);
      setText('');
    } else if (e.key === 'Escape') {
      setText('');
    } else if (e.key === 'Backspace' && text === '' && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }

  function onChange(value: string) {
    if (!value.includes(',')) return setText(value);
    const parts = value.split(',');
    add(parts.slice(0, -1));
    setText(parts.at(-1)!.trimStart());
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text/plain');
    if (!/[,\n]/.test(pasted)) return;
    e.preventDefault();
    add(pasted.split(/[,\n]/));
  }

  return (
    <section>
      <h1>Trip tags</h1>
      <p>Tag your trip so you can find it later. Press Enter or type a comma after each tag.</p>
      <ul className="tag-list" aria-label="Tags">
        {tags.map((t) => (
          <li key={t}>
            {t}{' '}
            <button type="button" aria-label={`Remove ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))}>
              ×
            </button>
          </li>
        ))}
      </ul>
      <label>
        New tag{' '}
        <input value={text} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} onPaste={onPaste} autoComplete="off" />
      </label>
      <p role="status">{tags.length === 1 ? '1 tag' : `${tags.length} tags`}</p>
    </section>
  );
}
