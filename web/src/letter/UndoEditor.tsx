import { useLayoutEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';

type Snapshot = { value: string; caret: number };
const MAX_STEPS = 50;
const PAUSE_MS = 1000;

function commonPrefix(a: string, b: string) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

export function UndoEditor() {
  const [history, setHistory] = useState<{ states: Snapshot[]; index: number }>({ states: [{ value: '', caret: 0 }], index: 0 });
  const box = useRef<HTMLTextAreaElement>(null);
  const last = useRef({ at: 0, kind: '', endedWord: true });
  const restoreCaret = useRef<number | null>(null);
  const current = history.states[history.index]!;

  useLayoutEffect(() => {
    if (restoreCaret.current === null || !box.current) return;
    box.current.setSelectionRange(restoreCaret.current, restoreCaret.current);
    restoreCaret.current = null;
  });

  function onChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const input = e.nativeEvent as InputEvent;
    const kind = input.inputType?.startsWith('delete') ? 'delete' : input.inputType === 'insertFromPaste' ? 'paste' : 'insert';
    const now = Date.now();
    const snapshot = { value: e.target.value, caret: e.target.selectionStart };
    const newStep = kind === 'paste' || kind !== last.current.kind || last.current.endedWord || now - last.current.at > PAUSE_MS;
    last.current = { at: now, kind, endedWord: kind === 'paste' || (kind === 'insert' && /\s$/.test(input.data ?? '')) };
    setHistory(({ states, index }) => {
      if (!newStep) return { states: [...states.slice(0, index), snapshot], index };
      const next = [...states.slice(0, index + 1), snapshot];
      const trimmed = next.length > MAX_STEPS + 1 ? next.slice(next.length - MAX_STEPS - 1) : next;
      return { states: trimmed, index: trimmed.length - 1 };
    });
  }

  function move(delta: number) {
    const index = history.index + delta;
    if (index < 0 || index >= history.states.length) return;
    last.current = { at: 0, kind: '', endedWord: true };
    const target = history.states[index]!;
    restoreCaret.current = delta < 0 ? commonPrefix(target.value, history.states[history.index]!.value) : target.caret;
    setHistory({ ...history, index });
    box.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (/^(Arrow|Home$|End$|Page)/.test(e.key)) last.current.endedWord = true;
    if (!(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    if (key === 'z' && !e.shiftKey) move(-1);
    else if ((key === 'z' && e.shiftKey) || key === 'y') move(1);
    else return;
    e.preventDefault();
  }

  return (
    <section>
      <h1>Letter</h1>
      <div className="undo-toolbar">
        <button type="button" onClick={() => move(-1)} disabled={history.index === 0}>
          Undo
        </button>
        <button type="button" onClick={() => move(1)} disabled={history.index === history.states.length - 1}>
          Redo
        </button>
      </div>
      <label>
        Your letter
        <textarea ref={box} rows={8} cols={60} value={current.value} onChange={onChange}
          onKeyDown={onKeyDown}
          onMouseDown={() => (last.current.endedWord = true)}
        />
      </label>
    </section>
  );
}
