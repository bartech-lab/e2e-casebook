import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Board } from '../board/Board.tsx';
import { CardEditor } from '../board/CardEditor.tsx';
import { fetchSandbox } from '../chat/api.ts';
import { ChatRoom } from '../chat/ChatRoom.tsx';
import { Account } from '../account/Account.tsx';
import { Mail } from '../account/Mail.tsx';
import { Activity } from '../activity/Activity.tsx';
import { Deals } from '../deals/Deals.tsx';
import { Exports } from '../exports/Exports.tsx';
import { GiftCards } from '../gifts/GiftCards.tsx';
import { Notes } from '../notes/Notes.tsx';
import { Budget } from '../budget/Budget.tsx';
import { Plan } from '../plan/Plan.tsx';
import { Playlist } from '../playlist/Playlist.tsx';
import { TopUp } from '../topup/TopUp.tsx';
import { Draft } from '../draft/Draft.tsx';
import { Calendar } from '../calendar/Calendar.tsx';
import { Contacts } from '../contacts/Contacts.tsx';
import { Stores } from '../stores/Stores.tsx';
import { Quote } from '../quote/Quote.tsx';
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
        <Link href={`${base}/mail`}>Mail</Link> · <Link href={`${base}/shop`}>Shop</Link> ·{' '}
        <Link href={`${base}/deals`}>Deals</Link> ·{' '}
        <Link href={`${base}/gifts`}>Gift cards</Link> ·{' '}
        <Link href={`${base}/notes`}>Notes</Link> ·{' '}
        <Link href={`${base}/budget`}>Budget</Link> ·{' '}
        <Link href={`${base}/plan`}>Plan</Link> ·{' '}
        <Link href={`${base}/playlist`}>Playlist</Link> ·{' '}
        <Link href={`${base}/topup`}>Top up</Link> ·{' '}
        <Link href={`${base}/draft`}>Draft</Link> ·{' '}
        <Link href={`${base}/calendar`}>Calendar</Link> ·{' '}
        <Link href={`${base}/contacts`}>Contacts</Link> ·{' '}
        <Link href={`${base}/stores`}>Stores</Link> ·{' '}
        <Link href={`${base}/quote`}>Quote</Link> <span>Name: {name}</span> <NotificationsBadge sandbox={sandbox} />
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
      ) : page === 'deals' ? (
        <Deals sandbox={sandbox} />
      ) : page === 'gifts' ? (
        <GiftCards />
      ) : page === 'notes' ? (
        <Notes />
      ) : page === 'budget' ? (
        <Budget />
      ) : page === 'plan' ? (
        <Plan sandbox={sandbox} />
      ) : page === 'playlist' ? (
        <Playlist sandbox={sandbox} />
      ) : page === 'topup' ? (
        <TopUp sandbox={sandbox} />
      ) : page === 'draft' ? (
        <Draft sandbox={sandbox} />
      ) : page === 'calendar' ? (
        <Calendar sandbox={sandbox} />
      ) : page === 'contacts' ? (
        <Contacts sandbox={sandbox} />
      ) : page === 'stores' ? (
        <Stores />
      ) : page === 'quote' ? (
        <Quote />
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
        <li>
          <Link href={`${base}/deals`}>Deals</Link>: deals picked for you, after a cookie consent banner.
        </li>
        <li>
          <Link href={`${base}/gifts`}>Gift cards</Link>: buy gift cards, with optional gift wrap.
        </li>
        <li>
          <Link href={`${base}/notes`}>Notes</Link>: star, archive, and delete notes.
        </li>
        <li>
          <Link href={`${base}/budget`}>Budget</Link>: expenses and a chart of spending by category.
        </li>
        <li>
          <Link href={`${base}/plan`}>Plan</Link>: your Pro plan, with pause and cancel.
        </li>
        <li>
          <Link href={`${base}/playlist`}>Playlist</Link>: reorder songs by dragging or with the keyboard.
        </li>
        <li>
          <Link href={`${base}/topup`}>Top up</Link>: add money to a wallet with a card entered in an embedded card form.
        </li>
        <li>
          <Link href={`${base}/draft`}>Draft</Link>: a letter that saves itself while you type.
        </li>
        <li>
          <Link href={`${base}/calendar`}>Calendar</Link>: connect a calendar through a sign-in window.
        </li>
        <li>
          <Link href={`${base}/contacts`}>Contacts</Link>: import contacts from a CSV file.
        </li>
        <li>
          <Link href={`${base}/stores`}>Stores</Link>: find the stores nearest to you or to a city.
        </li>
        <li>
          <Link href={`${base}/quote`}>Quote</Link>: a price total in your browser's language.
        </li>
      </ul>
    </section>
  );
}
