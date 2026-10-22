import { useEffect, useState, type DragEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError, json } from '../http.ts';

type Contact = { name: string; email: string };
type Result = { imported: number; errors: { row: number; message: string }[] };

function errorReport(errors: Result['errors']) {
  const quote = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  const lines = ['row,error', ...errors.map((e) => `${e.row},${quote(e.message)}`)];
  return URL.createObjectURL(new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/csv' }));
}

export function Contacts({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const key = ['contacts', sandbox];
  const list = useQuery({ queryKey: key, queryFn: async () => json<{ contacts: Contact[] }>(await fetch(`/api/s/${sandbox}/contacts`)) });
  const [result, setResult] = useState<Result | null>(null);
  const [message, setMessage] = useState('');
  const [report, setReport] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  useEffect(() => () => void (report && URL.revokeObjectURL(report)), [report]);

  async function upload(file: File) {
    setMessage('Importing…');
    setResult(null);
    setReport(null);
    try {
      const res = await fetch(`/api/s/${sandbox}/contacts/import`, { method: 'POST', headers: { 'content-type': 'text/csv' }, body: await file.text() });
      const data = await json<Result>(res);
      const n = data.imported;
      const m = data.errors.length;
      setMessage(`Imported ${n} contact${n === 1 ? '' : 's'}.${m ? ` ${m} row${m === 1 ? ' has an error' : 's have errors'}.` : ''}`);
      setResult(data);
      if (m) setReport(errorReport(data.errors));
      await client.invalidateQueries({ queryKey: key });
    } catch (error) {
      setMessage(error instanceof HttpError ? error.message : 'The import failed.');
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void upload(file);
  }

  return (
    <section>
      <h1>Contacts</h1>
      <p>Import a CSV file with the header row name,email.</p>
      <label>
        CSV file{' '}
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = '';
            if (file) void upload(file);
          }}
        />
      </label>
      <div
        className={over ? 'drop-zone over' : 'drop-zone'}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        Or drop a CSV file here
      </div>
      <p role="status">{message}</p>
      {result && result.errors.length > 0 && (
        <>
          <table>
            <caption>Rows with errors</caption>
            <thead>
              <tr>
                <th>Row</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {result.errors.map((e) => (
                <tr key={e.row}>
                  <td>{e.row}</td>
                  <td>{e.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {report && (
            <p>
              <a href={report} download="errors.csv">
                Download error report
              </a>
            </p>
          )}
        </>
      )}
      <h2>Your contacts</h2>
      <ul aria-label="Contacts">
        {list.data?.contacts.map((c) => (
          <li key={c.email}>
            {c.name} &lt;{c.email}&gt;
          </li>
        ))}
      </ul>
    </section>
  );
}
