import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Board } from '../board/Board.tsx';
import { CardEditor } from '../board/CardEditor.tsx';
import { fetchSandbox } from '../chat/api.ts';
import { ChatRoom } from '../chat/ChatRoom.tsx';
import { Account } from '../account/Account.tsx';
import { Mail } from '../account/Mail.tsx';
import { Activity } from '../activity/Activity.tsx';
import { Exports } from '../exports/Exports.tsx';
import { NotificationsBadge } from '../settings/NotificationsBadge.tsx';
import { Settings } from '../settings/Settings.tsx';
import { Reviews } from '../shop/Reviews.tsx';
import { Shop } from '../shop/Shop.tsx';
import { Split } from '../shop/Split.tsx';
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
  const product = /^shop\/([a-z]+)$/.exec(page);
  const split = /^shop\/orders\/(\d+)\/split$/.exec(page);
  return (
    <>
      <nav aria-label="Sandbox">
        <Link href={`${base}/chat`}>Chat</Link> · <Link href={`${base}/board`}>Board</Link> ·{' '}
        <Link href={`${base}/exports`}>Exports</Link> · <Link href={`${base}/activity`}>Activity</Link> ·{' '}
        <Link href={`${base}/settings`}>Settings</Link> · <Link href={`${base}/account`}>Account</Link> ·{' '}
        <Link href={`${base}/mail`}>Mail</Link> · <Link href={`${base}/shop`}>Shop</Link> <span>Name: {name}</span> <NotificationsBadge sandbox={sandbox} />
      </nav>
      {page === 'chat' ? (
        <ChatRoom sandbox={sandbox} name={name} />
      ) : page === 'board' ? (
        <Board sandbox={sandbox} name={name} />
      ) : card ? (
        <CardEditor key={card[1]} sandbox={sandbox} id={Number(card[1])} name={name} />
      ) : page === 'exports' ? (
        <Exports sandbox={sandbox} />
      ) : page === 'activity' ? (
        <Activity sandbox={sandbox} />
      ) : page === 'settings' ? (
        <Settings sandbox={sandbox} />
      ) : page === 'account' ? (
        <Account sandbox={sandbox} />
      ) : page === 'mail' ? (
        <Mail sandbox={sandbox} />
      ) : page === 'shop' ? (
        <Shop sandbox={sandbox} />
      ) : split ? (
        <Split key={split[1]} sandbox={sandbox} order={Number(split[1])} />
      ) : product ? (
        <Reviews key={product[1]} sandbox={sandbox} sku={product[1]!} name={name} />
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
        <li>
          <Link href={`${base}/activity`}>Activity</Link>: 10,000 entries in a virtualized list.
        </li>
        <li>
          <Link href={`${base}/settings`}>Settings</Link>: a save confirmation that disappears after 2 seconds.
        </li>
        <li>
          <Link href={`${base}/account`}>Account</Link> and <Link href={`${base}/mail`}>Mail</Link>: sign in
          with a link sent to a test inbox.
        </li>
        <li>
          <Link href={`${base}/shop`}>Shop</Link>: a cart with a discount code, VAT, optional shipping insurance, product reviews, and splitting an order.
        </li>
      </ul>
    </section>
  );
}
