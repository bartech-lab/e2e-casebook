import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { json, sendJson } from '../http.ts';

type Format = 'bold' | 'italic';

export function Bio({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const key = ['bio', sandbox];
  const url = `/api/s/${sandbox}/bio`;
  const saved = useQuery({ queryKey: key, queryFn: async () => json<{ html: string }>(await fetch(url)) });
  const editor = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const [active, setActive] = useState<Record<Format, boolean>>({ bold: false, italic: false });
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (saved.data && editor.current && !loaded.current) {
      editor.current.innerHTML = saved.data.html;
      loaded.current = true;
    }
  }, [saved.data]);

  useEffect(() => {
    const onSelection = () => {
      if (!editor.current?.contains(document.getSelection()?.anchorNode ?? null)) return;
      setActive({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic') });
    };
    document.addEventListener('selectionchange', onSelection);
    return () => document.removeEventListener('selectionchange', onSelection);
  }, []);

  function format(f: Format) {
    editor.current?.focus();
    document.execCommand(f);
    setActive((a) => ({ ...a, [f]: document.queryCommandState(f) }));
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!(e.ctrlKey || e.metaKey)) return;
    const f = ({ b: 'bold', i: 'italic' } as Record<string, Format>)[e.key.toLowerCase()];
    if (!f) return;
    e.preventDefault();
    format(f);
  }

  function onPaste(e: ClipboardEvent) {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    if (html) document.execCommand('insertHTML', false, html);
    else document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
  }

  async function save() {
    setStatus('Saving…');
    try {
      const body = await json<{ html: string }>(await fetch(url, sendJson('PUT', { html: editor.current!.innerHTML })));
      client.setQueryData(key, body);
      setStatus('Saved.');
    } catch {
      setStatus('Could not save. Try again.');
    }
  }

  return (
    <section>
      <h1>Bio</h1>
      <div role="toolbar" aria-label="Formatting">
        <button type="button" aria-pressed={active.bold} onMouseDown={(e) => e.preventDefault()} onClick={() => format('bold')}>
          Bold
        </button>{' '}
        <button type="button" aria-pressed={active.italic} onMouseDown={(e) => e.preventDefault()} onClick={() => format('italic')}>
          Italic
        </button>
      </div>
      <div
        ref={editor}
        className="rich-editor"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Bio"
        onKeyDown={onKeyDown}
        onPaste={onPaste}
      />
      <p>
        <button type="button" onClick={save}>
          Save
        </button>{' '}
        <span role="status">{status}</span>
      </p>
      <h2>Public profile</h2>
      <div className="profile" aria-label="Public profile" role="region" dangerouslySetInnerHTML={{ __html: saved.data?.html ?? '' }} />
    </section>
  );
}
