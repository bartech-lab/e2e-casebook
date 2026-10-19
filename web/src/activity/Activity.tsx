import { useCallback, useRef, useState } from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import { json } from '../http.ts';

type Entry = { n: number; text: string };
const TOTAL = 10_000;

function pageSizeFromUrl() {
  const raw = Number(new URLSearchParams(location.search).get('pageSize'));
  return Number.isInteger(raw) && raw >= 1 && raw <= 500 ? raw : 50;
}

export function Activity({ sandbox }: { sandbox: string }) {
  const pageSize = useRef(pageSizeFromUrl()).current;
  const list = useRef<VirtuosoHandle>(null);
  const loaded = useRef(new Set<number>());
  const [entries, setEntries] = useState<Map<number, Entry>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (page: number) => {
      if (loaded.current.has(page)) return;
      loaded.current.add(page);
      try {
        const from = page * pageSize + 1;
        const res = await json<{ entries: Entry[] }>(
          await fetch(`/api/s/${sandbox}/activity?from=${from}&limit=${pageSize}`),
        );
        setEntries((old) => {
          const next = new Map(old);
          for (const e of res.entries) next.set(e.n, e);
          return next;
        });
      } catch (e) {
        loaded.current.delete(page);
        setError((e as Error).message);
      }
    },
    [sandbox, pageSize],
  );

  return (
    <section>
      <h1>Activity</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const n = Number(new FormData(e.currentTarget).get('entry'));
          if (Number.isInteger(n) && n >= 1 && n <= TOTAL) list.current?.scrollToIndex({ index: n - 1, align: 'center' });
        }}
      >
        <label>
          Go to entry <input name="entry" type="number" min={1} max={TOTAL} required />
        </label>{' '}
        <button type="submit">Go</button>
      </form>
      {error && <p role="alert">Could not load activity: {error}</p>}
      <Virtuoso
        ref={list}
        style={{ height: 400 }}
        totalCount={TOTAL}
        rangeChanged={({ startIndex, endIndex }) => {
          for (let p = Math.floor(startIndex / pageSize); p <= Math.floor(endIndex / pageSize); p++) void loadPage(p);
        }}
        components={{
          List: ({ style, children, ...props }) => (
            <ol aria-label="Activity" style={{ ...style, margin: 0, paddingLeft: 0, listStyle: 'none' }} {...props}>
              {children}
            </ol>
          ),
          Item: ({ children, ...props }) => (
            <li {...props} style={{ ...props.style, padding: '4px 0', borderBottom: '1px solid #eee' }}>
              {children}
            </li>
          ),
        }}
        itemContent={(index) => {
          const entry = entries.get(index + 1);
          return entry ? (
            <span data-n={entry.n}>
              #{entry.n} {entry.text}
            </span>
          ) : (
            <span aria-busy="true">#{index + 1} loading…</span>
          );
        }}
      />
    </section>
  );
}
