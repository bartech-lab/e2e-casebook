import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Board } from '../board/Board.tsx';
import { CardEditor } from '../board/CardEditor.tsx';
import { fetchSandbox } from '../chat/api.ts';
import { ChatRoom } from '../chat/ChatRoom.tsx';
import { Exports } from '../exports/Exports.tsx';
import { HttpError } from '../http.ts';
import { Link } from '../router.tsx';

const nameKey = (sandbox: string) => `name:${sandbox}`;

export function SandboxShell({ sandbox, page }: { sandbox: string; page: string }) {
  const [name, setName] = useState(() => sessionStorage.getItem(nameKey(sandbox)));
  const info = useQuery({ queryKey: ['sandbox', sandbox], queryFn: () => fetchSandbox(sandbox), staleTime: Infinity });

  if (info.error instanceof HttpError && info.error.status === 404) {
    return (
      <section>
        <h1>Sandbox not found</h1>
        <p>
          It may have expired. <a href="/">Start a new sandbox</a>.
        </p>
      </section>
    );
  }

  if (!name) {
    return (
      <form
        onSubmit={(e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const value = new FormData(e.currentTarget).get('name');
          if (typeof value !== 'string' || !value.trim()) return;
          sessionStorage.setItem(nameKey(sandbox), value.trim());
          setName(value.trim());
        }}
      >
        <h1>Join the sandbox</h1>
        <label>
          Your name <input name="name" maxLength={40} required autoComplete="off" />
        </label>
        <button type="submit">Join</button>
      </form>
    );
  }

  const base = `/s/${sandbox}`;
  const card = /^cards\/(\d+)$/.exec(page);
  return (
    <>
      <nav aria-label="Sandbox">
        <Link href={`${base}/chat`}>Chat</Link> · <Link href={`${base}/board`}>Board</Link> ·{' '}
        <Link href={`${base}/exports`}>Exports</Link> <span>Signed in as {name}</span>
      </nav>
      {page === 'chat' ? (
        <ChatRoom sandbox={sandbox} name={name} />
      ) : page === 'board' ? (
        <Board sandbox={sandbox} name={name} />
      ) : card ? (
        <CardEditor key={card[1]} sandbox={sandbox} id={Number(card[1])} name={name} />
      ) : page === 'exports' ? (
        <Exports sandbox={sandbox} />
      ) : (
        <SandboxHome base={base} />
      )}
    </>
  );
}

function SandboxHome({ base }: { base: string }) {
  return (
    <section>
      <h1>Sandbox</h1>
      <p>Open this page in a second window or browser to be a second user.</p>
      <ul>
        <li>
          <Link href={`${base}/chat`}>Chat</Link>: two users, live messages, reconnects.
        </li>
        <li>
          <Link href={`${base}/board`}>Board</Link>: move cards between columns; edit a card while someone else does.
        </li>
        <li>
          <Link href={`${base}/exports`}>Exports</Link>: a background export with progress, cancel, and retry.
        </li>
      </ul>
    </section>
  );
}
