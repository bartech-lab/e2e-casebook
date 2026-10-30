const FILES = [
  { raw: 'invoice\u202Efdp.exe', kb: 48, owner: 'Kamil' },
  { raw: 'report.pdf.exe', kb: 120, owner: 'Ola' },
  { raw: 'סיכום פגישה', kb: 12, owner: 'Dana' },
  { raw: 'photo\u2067gpj.exe\u2069', kb: 300, owner: 'Kamil' },
  { raw: 'notes.txt', kb: 2, owner: 'Ola' },
];

const MARKS = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

const escapeMarks = (name: string) => name.replace(MARKS, (c) => `⟨U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}⟩`);

function describe(raw: string) {
  const clean = raw.replace(MARKS, '');
  const dot = clean.lastIndexOf('.');
  return {
    shown: escapeMarks(raw),
    safe: clean,
    type: dot > 0 ? clean.slice(dot + 1).toUpperCase() : 'none',
    marked: new RegExp(MARKS.source).test(raw),
  };
}

export function SharedFiles() {
  return (
    <section className="shared-files">
      <h1>Shared files</h1>
      <p>Files your team has shared with you.</p>
      <ul aria-label="Shared files">
        {FILES.map((f) => {
          const d = describe(f.raw);
          return (
            <li key={f.raw}>
              <bdi className="file-name">{d.shown}</bdi> <span className="file-meta">{f.kb} KB, by {f.owner}</span>{' '}
              <span className="file-type">Type: {d.type}</span>
              {d.marked && <span className="file-warning"> Hidden direction marks in this name.</span>}{' '}
              <a href={`#file-${encodeURIComponent(d.safe)}`} download={d.safe}>
                Download
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
