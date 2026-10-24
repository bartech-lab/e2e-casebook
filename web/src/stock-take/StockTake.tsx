import { useState, type ClipboardEvent } from 'react';

const PRODUCTS = ['Flour 1 kg', 'Sugar 1 kg', 'Rice 500 g', 'Oats 500 g', 'Salt 1 kg', 'Lentils 500 g'];
const COLUMNS = ['Shelf', 'Back room', 'Note'] as const;
const NUMERIC = [true, true, false];

function parseTsv(text: string) {
  const t = text.replace(/\r\n?/g, '\n');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i]!;
    if (quoted) {
      if (c !== '"') cell += c;
      else if (t[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = false;
    } else if (c === '"' && cell === '') quoted = true;
    else if (c === '\t') {
      row.push(cell);
      cell = '';
    } else if (c === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const count = (v: string) => {
  const s = v.replace(/[ \u00a0\u202f]/g, '');
  return /^\d+$/.test(s) ? Number(s) : null;
};

export function StockTake() {
  const [cells, setCells] = useState(() => PRODUCTS.map(() => COLUMNS.map(() => '')));
  const [message, setMessage] = useState('');

  function set(r: number, c: number, v: string) {
    setCells((cur) => cur.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)));
  }

  function paste(r: number, c: number) {
    return (e: ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const text = e.clipboardData.getData('text/plain');
      if (!/[\t\n\r]/.test(text)) return;
      e.preventDefault();
      const rows = parseTsv(text);
      let placed = 0;
      let dropped = 0;
      const next = cells.map((row) => [...row]);
      rows.forEach((values, i) =>
        values.forEach((v, j) => {
          const rr = r + i;
          const cc = c + j;
          if (rr < PRODUCTS.length && cc < COLUMNS.length) {
            next[rr]![cc] = v;
            placed++;
          } else dropped++;
        }),
      );
      setCells(next);
      setMessage(dropped ? `Pasted ${placed} cells. ${dropped} did not fit.` : `Pasted ${placed} cells.`);
    };
  }

  const total = (c: number) => cells.reduce((s, row) => s + (count(row[c]!) ?? 0), 0);
  return (
    <section>
      <h1>Stock take</h1>
      <p>Type the counts, or copy cells from a spreadsheet and paste them into the first cell.</p>
      <table aria-label="Stock">
        <thead>
          <tr>
            <th scope="col">Product</th>
            {COLUMNS.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PRODUCTS.map((p, r) => (
            <tr key={p}>
              <th scope="row">{p}</th>
              {COLUMNS.map((col, c) => {
                const v = cells[r]![c]!;
                const invalid = NUMERIC[c] && v !== '' && count(v) === null;
                const props = { 'aria-label': `${col}, ${p}`, value: v, onPaste: paste(r, c) };
                return (
                  <td key={col}>
                    {NUMERIC[c] ? (
                      <input {...props} inputMode="numeric" size={6} aria-invalid={invalid} onChange={(e) => set(r, c, e.target.value)} />
                    ) : (
                      <textarea {...props} rows={1} onChange={(e) => set(r, c, e.target.value)} />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td>{total(0)}</td>
            <td>{total(1)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
      <p role="status">{message}</p>
    </section>
  );
}
