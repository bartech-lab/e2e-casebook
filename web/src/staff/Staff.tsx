import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { json } from '../http.ts';

type Member = { id: number; name: string; role: string };
type Details = Member & { phone: string };

function EditMember({ sandbox, id, count, onNext, onClose, onSaved }: { sandbox: string; id: number; count: number; onNext: () => void; onClose: () => void; onSaved: (m: Details) => void }) {
  const [member, setMember] = useState<Details | null>(null);
  const [error, setError] = useState('');
  const box = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const nameBox = useRef<HTMLInputElement>(null);
  const focusOnLoad = useRef(false);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  useEffect(() => {
    let live = true;
    setMember(null);
    setError('');
    void fetch(`/api/s/${sandbox}/staff/${id}`)
      .then((r) => json<Details>(r))
      .then((m) => {
        if (!live) return;
        focusOnLoad.current = document.activeElement === heading.current;
        setMember(m);
      });
    return () => {
      live = false;
    };
  }, [sandbox, id]);

  useEffect(() => {
    if (!member || !focusOnLoad.current) return;
    focusOnLoad.current = false;
    nameBox.current?.focus();
  }, [member]);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !box.current) return;
    const items = Array.from(box.current.querySelectorAll<HTMLElement>('input, button:not([disabled])'));
    const first = items[0];
    const last = items[items.length - 1];
    if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    } else if (e.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) {
      e.preventDefault();
      last?.focus();
    }
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!member) return;
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/s/${sandbox}/staff/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: form.get('name'), role: form.get('role'), phone: form.get('phone') }),
    });
    if (!res.ok) {
      setError(((await res.json()) as { error: string }).error);
      return;
    }
    onSaved(await json<Details>(res));
  }

  return (
    <div className="modal-backdrop">
      <div ref={box} className="modal" role="dialog" aria-modal="true" aria-labelledby="staff-edit-title" onKeyDown={onKeyDown}>
        <h2 id="staff-edit-title" ref={heading} tabIndex={-1}>
          Edit staff member
        </h2>
        <p>
          {id} of {count}
        </p>
        {member ? (
          <form key={member.id} onSubmit={(e) => void save(e)}>
            <label>
              Name <input ref={nameBox} name="name" defaultValue={member.name} />
            </label>
            <label>
              Role <input name="role" defaultValue={member.role} />
            </label>
            <label>
              Phone <input name="phone" defaultValue={member.phone} />
            </label>
            {error && <p role="alert">{error}</p>}
            <button type="submit">Save</button>
          </form>
        ) : (
          <p>Loading…</p>
        )}
        <button type="button" onClick={onNext}>
          Next
        </button>{' '}
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function Staff({ sandbox }: { sandbox: string }) {
  const [staff, setStaff] = useState<Member[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [toast, setToast] = useState('');
  const editButtons = useRef(new Map<number, HTMLButtonElement>());
  const returnTo = useRef<number | null>(null);

  useEffect(() => {
    void fetch(`/api/s/${sandbox}/staff`)
      .then((r) => json<{ staff: Member[] }>(r))
      .then((d) => setStaff(d.staff));
  }, [sandbox]);

  useEffect(() => {
    if (editing !== null || returnTo.current === null) return;
    editButtons.current.get(returnTo.current)?.focus();
    returnTo.current = null;
  }, [editing, staff]);

  function open(id: number) {
    setToast('');
    setEditing(id);
  }

  function close() {
    returnTo.current = editing;
    setEditing(null);
  }

  function saved(m: Details) {
    returnTo.current = m.id;
    setStaff((cur) => cur.map((s) => (s.id === m.id ? { id: m.id, name: m.name, role: m.role } : s)));
    setEditing(null);
    setToast(`Saved ${m.name}.`);
  }

  return (
    <section>
      <h1>Staff</h1>
      <ul aria-label="Staff">
        {staff.map((m) => (
          <li key={m.id}>
            {m.name}, {m.role}{' '}
            <button
              type="button"
              aria-label={`Edit ${m.name}`}
              ref={(el) => {
                if (el) editButtons.current.set(m.id, el);
                else editButtons.current.delete(m.id);
              }}
              onClick={() => open(m.id)}
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
      <div role="status">{toast}</div>
      {editing !== null && (
        <EditMember
          sandbox={sandbox}
          id={editing}
          count={staff.length}
          onNext={() => setEditing(editing % staff.length + 1)}
          onClose={close}
          onSaved={saved}
        />
      )}
    </section>
  );
}
