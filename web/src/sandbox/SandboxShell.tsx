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
import { Booking, type BookingStep } from '../booking/Booking.tsx';
import { Feed } from '../feed/Feed.tsx';
import { Checklist } from '../checklist/Checklist.tsx';
import { Vault } from '../vault/Vault.tsx';
import { BasketPage } from '../basket/Basket.tsx';
import { Support } from '../support/Support.tsx';
import { Receipt } from '../receipt/Receipt.tsx';
import { Signup } from '../signup/Signup.tsx';
import { Bio } from '../bio/Bio.tsx';
import { Search } from '../search/Search.tsx';
import { Invoices } from '../invoices/Invoices.tsx';
import { PriceFilter } from '../prices/PriceFilter.tsx';
import { Reminders } from '../reminders/Reminders.tsx';
import { Address } from '../address/Address.tsx';
import { Feedback } from '../feedback/Feedback.tsx';
import { Share } from '../share/Share.tsx';
import { Updates } from '../updates/Updates.tsx';
import { NotificationsBadge } from '../settings/NotificationsBadge.tsx';
import { Settings } from '../settings/Settings.tsx';
import { Reviews } from '../shop/Reviews.tsx';
import { Shop } from '../shop/Shop.tsx';
import { Split } from '../shop/Split.tsx';
import { HttpError } from '../http.ts';
import { Link } from '../router.tsx';
import { Inbox } from '../inbox/Inbox.tsx';
import { Orders } from '../orders/Orders.tsx';
import { Files } from '../files/Files.tsx';
import { Tasks } from '../tasks/Tasks.tsx';
import { Itinerary } from '../itinerary/Itinerary.tsx';
import { Verify } from '../verify/Verify.tsx';
import { Summary } from '../summary/Summary.tsx';
import { Shipping } from '../shipping/Shipping.tsx';
import { Gallery } from '../gallery/Gallery.tsx';
import { Holiday } from '../holiday/Holiday.tsx';
import { StaySignedIn } from '../account-signin/StaySignedIn.tsx';

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
  const booking = /^booking\/(dates|guests|review|done)$/.exec(page);
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
        <Link href={`${base}/quote`}>Quote</Link> ·{' '}
        <Link href={`${base}/booking/dates`}>Booking</Link> ·{' '}
        <Link href={`${base}/feed`}>Feed</Link> ·{' '}
        <Link href={`${base}/checklist`}>Checklist</Link> ·{' '}
        <Link href={`${base}/vault`}>Vault</Link> ·{' '}
        <Link href={`${base}/basket`}>Basket</Link> ·{' '}
        <Link href={`${base}/support`}>Support</Link> ·{' '}
        <Link href={`${base}/receipt`}>Receipt</Link> ·{' '}
        <Link href={`${base}/signup`}>Sign up</Link> ·{' '}
        <Link href={`${base}/bio`}>Bio</Link> ·{' '}
        <Link href={`${base}/search`}>Search</Link> ·{' '}
        <Link href={`${base}/invoices`}>Invoices</Link> ·{' '}
        <Link href={`${base}/prices`}>Price filter</Link> ·{' '}
        <Link href={`${base}/reminders`}>Reminders</Link> ·{' '}
        <Link href={`${base}/address`}>Address</Link> ·{' '}
        <Link href={`${base}/feedback`}>Feedback</Link> ·{' '}
        <Link href={`${base}/share`}>Share</Link> ·{' '}
        <Link href={`${base}/updates`}>Updates</Link> ·{' '}
        <Link href={`${base}/inbox`}>Inbox</Link> ·{' '}
        <Link href={`${base}/orders`}>Orders</Link> ·{' '}
        <Link href={`${base}/files`}>Files</Link> ·{' '}
        <Link href={`${base}/tasks`}>Tasks</Link> ·{' '}
        <Link href={`${base}/itinerary`}>Itinerary</Link> ·{' '}
        <Link href={`${base}/verify`}>Verify phone</Link> ·{' '}
        <Link href={`${base}/summary`}>Order summary</Link> ·{' '}
        <Link href={`${base}/shipping`}>Shipping address</Link> ·{' '}
        <Link href={`${base}/gallery`}>Gallery</Link> ·{' '}
        <Link href={`${base}/holiday`}>Holiday request</Link> ·{' '}
        <Link href={`${base}/sign-in`}>Stay signed in</Link> <span>Name: {name}</span> <NotificationsBadge sandbox={sandbox} />
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
      ) : page === 'feed' ? (
        <Feed sandbox={sandbox} />
      ) : page === 'checklist' ? (
        <Checklist sandbox={sandbox} />
      ) : page === 'vault' ? (
        <Vault sandbox={sandbox} />
      ) : page === 'basket' ? (
        <BasketPage sandbox={sandbox} />
      ) : page === 'support' ? (
        <Support sandbox={sandbox} />
      ) : page === 'receipt' ? (
        <Receipt />
      ) : page === 'signup' ? (
        <Signup />
      ) : page === 'bio' ? (
        <Bio sandbox={sandbox} />
      ) : page === 'search' ? (
        <Search sandbox={sandbox} />
      ) : page === 'invoices' ? (
        <Invoices sandbox={sandbox} />
      ) : page === 'prices' ? (
        <PriceFilter />
      ) : page === 'reminders' ? (
        <Reminders sandbox={sandbox} />
      ) : page === 'address' ? (
        <Address sandbox={sandbox} />
      ) : page === 'feedback' ? (
        <Feedback sandbox={sandbox} />
      ) : page === 'share' ? (
        <Share sandbox={sandbox} />
      ) : page === 'updates' ? (
        <Updates sandbox={sandbox} />
      ) : page === 'inbox' ? (
        <Inbox sandbox={sandbox} />
      ) : page === 'orders' ? (
        <Orders sandbox={sandbox} />
      ) : page === 'files' ? (
        <Files sandbox={sandbox} />
      ) : page === 'tasks' ? (
        <Tasks />
      ) : page === 'itinerary' ? (
        <Itinerary />
      ) : page === 'verify' ? (
        <Verify sandbox={sandbox} />
      ) : page === 'summary' ? (
        <Summary sandbox={sandbox} />
      ) : page === 'shipping' ? (
        <Shipping sandbox={sandbox} />
      ) : page === 'gallery' ? (
        <Gallery sandbox={sandbox} />
      ) : page === 'holiday' ? (
        <Holiday />
      ) : page === 'sign-in' ? (
        <StaySignedIn sandbox={sandbox} />
      ) : booking ? (
        <Booking sandbox={sandbox} step={booking[1] as BookingStep} />
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
        <li>
          <Link href={`${base}/booking/dates`}>Booking</Link>: book a room in three steps.
        </li>
        <li>
          <Link href={`${base}/feed`}>Feed</Link>: an endless list of posts, with new ones arriving.
        </li>
        <li>
          <Link href={`${base}/checklist`}>Checklist</Link>: a list that keeps working offline.
        </li>
        <li>
          <Link href={`${base}/vault`}>Vault</Link>: notes behind a code from an authenticator app.
        </li>
        <li>
          <Link href={`${base}/basket`}>Basket</Link>: a basket shared by every tab.
        </li>
        <li>
          <Link href={`${base}/support`}>Support</Link>: write to support while signed in.
        </li>
        <li>
          <Link href={`${base}/receipt`}>Receipt</Link>: a printable receipt, in light and dark.
        </li>
        <li>
          <Link href={`${base}/signup`}>Sign up</Link>: a form that has to work with a keyboard and a screen reader.
        </li>
        <li>
          <Link href={`${base}/bio`}>Bio</Link>: a formatted bio shown on your public profile.
        </li>
        <li>
          <Link href={`${base}/search`}>Search</Link>: products that appear as you type.
        </li>
        <li>
          <Link href={`${base}/invoices`}>Invoices</Link>: invoices you can download as PDF.
        </li>
        <li>
          <Link href={`${base}/prices`}>Price filter</Link>: products in a price range you drag or key in.
        </li>
        <li>
          <Link href={`${base}/reminders`}>Reminders</Link>: a reminder that pops up later, even after a reload.
        </li>
        <li>
          <Link href={`${base}/address`}>Address</Link>: a form that warns before you lose your changes.
        </li>
        <li>
          <Link href={`${base}/feedback`}>Feedback</Link>: rate us with a star widget from another team.
        </li>
        <li>
          <Link href={`${base}/share`}>Share</Link>: copy an invite link.
        </li>
        <li>
          <Link href={`${base}/updates`}>Updates</Link>: tells you when a new version of the app is out.
        </li>
        <li>
          <Link href={`${base}/inbox`}>Inbox</Link>: pick many messages at once and archive them.
        </li>
        <li>
          <Link href={`${base}/orders`}>Orders</Link>: a table you can sort by any column, ten orders a page.
        </li>
        <li>
          <Link href={`${base}/files`}>Files</Link>: delete a file, with a few seconds to undo it.
        </li>
        <li>
          <Link href={`${base}/tasks`}>Tasks</Link>: a to-do list you can drive with keyboard shortcuts.
        </li>
        <li>
          <Link href={`${base}/itinerary`}>Itinerary</Link>: a trip plan made to be printed.
        </li>
        <li>
          <Link href={`${base}/verify`}>Verify phone</Link>: text yourself a code, at most once every 30 seconds.
        </li>
        <li>
          <Link href={`${base}/summary`}>Order summary</Link>: an order summary in English or Arabic.
        </li>
        <li>
          <Link href={`${base}/shipping`}>Shipping address</Link>: an address form that changes with the country.
        </li>
        <li>
          <Link href={`${base}/gallery`}>Gallery</Link>: 24 photos that load as you scroll.
        </li>
        <li>
          <Link href={`${base}/holiday`}>Holiday request</Link>: pick the days of a holiday on a calendar or by typing them.
        </li>
        <li>
          <Link href={`${base}/sign-in`}>Stay signed in</Link>: sign in, and choose whether the browser remembers you.
        </li>
      </ul>
    </section>
  );
}
