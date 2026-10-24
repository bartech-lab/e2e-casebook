import { useState, type KeyboardEvent } from 'react';

const LIMIT = 40;
const KEY = 'phrasebook';
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
const count = (text: string) => [...segmenter.segment(text)].length;
const same = (a: string, b: string) => a.normalize('NFC') === b.normalize('NFC');

function load(sandbox: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(`${KEY}-${sandbox}`) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export function Phrasebook({ sandbox }: { sandbox: string }) {
  const [phrases, setPhrases] = useState(() => load(sandbox));
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const length = count(text.trim());
  const tooLong = length > LIMIT;

  function add() {
    const phrase = text.trim();
    if (!phrase || tooLong) return;
    if (phrases.some((p) => same(p, phrase))) {
      setMessage(`"${phrase}" is already in your phrasebook.`);
      return;
    }
    const next = [...phrases, phrase.normalize('NFC')];
    setPhrases(next);
    localStorage.setItem(`${KEY}-${sandbox}`, JSON.stringify(next));
    setText('');
    setMessage(`Added "${phrase}".`);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    } else if (e.key === 'Escape') {
      setText('');
      setMessage('');
    }
  }

  return (
    <section>
      <h1>Phrasebook</h1>
      <p>Type a phrase in any language and press Enter to add it.</p>
      <label>
        New phrase{' '}
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKeyDown} aria-describedby="phrase-count" aria-invalid={tooLong} />
      </label>{' '}
      <button type="button" onClick={add} disabled={!text.trim() || tooLong}>
        Add
      </button>
      <p id="phrase-count" className={tooLong ? 'field-error' : undefined}>
        {length} / {LIMIT}
      </p>
      <p role="status">{message}</p>
      <ul aria-label="Phrases">
        {phrases.map((p) => (
          <li key={p}>
            {p}
          </li>
        ))}
      </ul>
    </section>
  );
}
