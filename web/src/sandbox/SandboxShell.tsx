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
import { Podcast } from '../podcast/Podcast.tsx';
import { SiteMenu } from '../site-menu/SiteMenu.tsx';
import { IdleSession } from '../idle-session/IdleSession.tsx';
import { Team } from '../team/Team.tsx';
import { Meetings } from '../meetings/Meetings.tsx';
import { Directory } from '../directory/Directory.tsx';
import { ConfirmEmail } from '../confirm-email/ConfirmEmail.tsx';
import { Plurals } from '../plurals/Plurals.tsx';
import { Passkeys } from '../passkeys/Passkeys.tsx';
import { Delivery } from '../delivery/Delivery.tsx';
import { Import } from '../import/Import.tsx';
import { Packing } from '../packing/Packing.tsx';
import { Help } from '../help/Help.tsx';
import { Review } from '../review/Review.tsx';
import { Report } from '../report/Report.tsx';
import { UploadPage } from '../upload/Upload.tsx';
import { Ticket } from '../ticket/Ticket.tsx';
import { Timesheet } from '../timesheet/Timesheet.tsx';
import { Embed } from '../embed/Embed.tsx';
import { Country } from '../country/Country.tsx';
import { Appearance } from '../appearance/Appearance.tsx';
import { StatementPage } from '../statement/Statement.tsx';
import { Plans } from '../plans/Plans.tsx';
import { PriceAlert } from '../price-alert/PriceAlert.tsx';
import { LiveScore } from '../live-score/LiveScore.tsx';
import { MobileInbox } from '../mobile-inbox/MobileInbox.tsx';
import { ChangePassword } from '../password/ChangePassword.tsx';
import { FlashSale } from '../flash-sale/FlashSale.tsx';
import { ClassList } from '../class-list/ClassList.tsx';
import { Newsletter } from '../newsletter/Newsletter.tsx';
import { PostEditor } from '../post-editor/PostEditor.tsx';
import { Announcements } from '../announcements/Announcements.tsx';
import { VoiceNote } from '../voice-note/VoiceNote.tsx';
import { PriceList } from '../price-list/PriceList.tsx';
import { Contributors } from '../contributors/Contributors.tsx';
import { ProductTabs } from '../product-tabs/ProductTabs.tsx';
import { FolderTree } from '../folder-tree/FolderTree.tsx';
import { Promotions } from '../promotions/Promotions.tsx';
import { LocalNotes } from '../local-notes/LocalNotes.tsx';
import { UndoEditor } from '../letter/UndoEditor.tsx';
import { ShareRecipe } from '../share-recipe/ShareRecipe.tsx';
import { PhotoViewer } from '../photos/PhotoViewer.tsx';
import { DeliveryForm } from '../delivery-form/DeliveryForm.tsx';
import { HotelSearch } from '../hotels/HotelSearch.tsx';
import { Lamps } from '../lamps/Lamps.tsx';
import { MailingList } from '../mailing-list/MailingList.tsx';
import { TripTags } from '../trip-tags/TripTags.tsx';
import { GigTickets } from '../gig-tickets/GigTickets.tsx';
import { PrivacySettings } from '../privacy/PrivacySettings.tsx';
import { TrainTicket } from '../train-ticket/TrainTicket.tsx';
import { Pancakes } from '../pancakes/Pancakes.tsx';
import { FolderUpload } from '../album/FolderUpload.tsx';
import { FloorPlan } from '../floor-plan/FloorPlan.tsx';
import { ReadingList } from '../reading-list/ReadingList.tsx';
import { BusStop } from '../bus-stop/BusStop.tsx';
import { Workspace } from '../workspace/Workspace.tsx';
import { SavedSearches } from '../saved-searches/SavedSearches.tsx';
import { Groceries } from '../groceries/Groceries.tsx';
import { EventFeedback } from '../event-feedback/EventFeedback.tsx';
import { OrdersWidget } from '../orders-widget/OrdersWidget.tsx';
import { Highlights } from '../highlights/Highlights.tsx';
import { SellBike } from '../sell-bike/SellBike.tsx';
import { ExpenseClaims } from '../expense-claims/ExpenseClaims.tsx';
import { Flats } from '../flats/Flats.tsx';
import { Parking } from '../parking/Parking.tsx';
import { Drive } from '../drive/Drive.tsx';
import { VillageHall } from '../village-hall/VillageHall.tsx';
import { Assistant } from '../assistant/Assistant.tsx';
import { Comments } from '../comments/Comments.tsx';
import { AlertSettings } from '../alert-settings/AlertSettings.tsx';
import { ChoirSignup } from '../choir/ChoirSignup.tsx';
import { SharedPhotos } from '../shared-photos/SharedPhotos.tsx';
import { MailReader } from '../mail-reader/MailReader.tsx';
import { Receipts } from '../receipts/Receipts.tsx';
import { GuestbookLink } from '../guestbook/GuestbookLink.tsx';
import { Poster } from '../poster/Poster.tsx';
import { FieldNotes } from '../field-notes/FieldNotes.tsx';
import { ClubActivity } from '../club-activity/ClubActivity.tsx';
import { NoticeBoard } from '../notice-board/NoticeBoard.tsx';
import { Prints } from '../prints/Prints.tsx';
import { StudyGroup } from '../study-group/StudyGroup.tsx';
import { BillingDetails } from '../billing-details/BillingDetails.tsx';
import { FlightSearch } from '../flight-search/FlightSearch.tsx';
import { BankTransfer } from '../bank-transfer/BankTransfer.tsx';
import { LibraryCard } from '../library-card/LibraryCard.tsx';
import { Fete } from '../fete/Fete.tsx';
import { Rooms } from '../rooms/Rooms.tsx';
import { Favourites } from '../favourites/Favourites.tsx';
import { Handover } from '../handover/Handover.tsx';
import { TicketContact } from '../ticket-contact/TicketContact.tsx';
import { Handbook } from '../handbook/Handbook.tsx';
import { Barber } from '../barber/Barber.tsx';
import { RunningOrder } from '../running-order/RunningOrder.tsx';
import { SitePhotos } from '../site-photos/SitePhotos.tsx';
import { Staff } from '../staff/Staff.tsx';
import { Answers } from '../answers/Answers.tsx';
import { TileOrder } from '../tile-order/TileOrder.tsx';
import { ShoeSize } from '../shoe-size/ShoeSize.tsx';
import { SavedCards } from '../saved-cards/SavedCards.tsx';
import { StockTake } from '../stock-take/StockTake.tsx';
import { Cookbook } from '../cookbook/Cookbook.tsx';

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
        <Link href={`${base}/sign-in`}>Stay signed in</Link> ·{' '}
        <Link href={`${base}/podcast`}>Podcast</Link> ·{' '}
        <Link href={`${base}/bakery`}>Bakery</Link> ·{' '}
        <Link href={`${base}/session`}>Session</Link> ·{' '}
        <Link href={`${base}/team`}>Team</Link> ·{' '}
        <Link href={`${base}/meetings`}>Meetings</Link> ·{' '}
        <Link href={`${base}/directory`}>Directory</Link> ·{' '}
        <Link href={`${base}/confirm-email`}>Confirm email</Link> ·{' '}
        <Link href={`${base}/messages`}>Messages</Link> ·{' '}
        <Link href={`${base}/passkeys`}>Passkeys</Link> ·{' '}
        <Link href={`${base}/delivery`}>Delivery</Link> ·{' '}
        <Link href={`${base}/import`}>Import</Link> ·{' '}
        <Link href={`${base}/packing`}>Packing list</Link> ·{' '}
        <Link href={`${base}/help`}>Help centre</Link> ·{' '}
        <Link href={`${base}/review`}>Order review</Link> ·{' '}
        <Link href={`${base}/report`}>Sales report</Link> ·{' '}
        <Link href={`${base}/upload`}>Upload</Link> ·{' '}
        <Link href={`${base}/ticket`}>Support ticket</Link> ·{' '}
        <Link href={`${base}/timesheet`}>Timesheet</Link> ·{' '}
        <Link href={`${base}/shop-reviews`}>Shop reviews</Link> ·{' '}
        <Link href={`${base}/country`}>Country</Link> ·{' '}
        <Link href={`${base}/appearance`}>Appearance</Link> ·{' '}
        <Link href={`${base}/statement`}>Statement</Link> ·{' '}
        <Link href={`${base}/plans`}>Plans</Link> ·{' '}
        <Link href={`${base}/price-alert`}>Price alerts</Link> ·{' '}
        <Link href={`${base}/live-score`}>Live score</Link> ·{' '}
        <Link href={`${base}/mobile-inbox`}>Mobile inbox</Link> ·{' '}
        <Link href={`${base}/password`}>Change password</Link> ·{' '}
        <Link href={`${base}/flash-sale`}>Flash sale</Link> ·{' '}
        <Link href={`${base}/class-list`}>Class list</Link> ·{' '}
        <Link href={`${base}/newsletter`}>Newsletter</Link> ·{' '}
        <Link href={`${base}/post-editor`}>Post editor</Link> ·{' '}
        <Link href={`${base}/announcements`}>Announcements</Link> ·{' '}
        <Link href={`${base}/voice-note`}>Voice note</Link> ·{' '}
        <Link href={`${base}/price-list`}>Price list</Link> ·{' '}
        <Link href={`${base}/contributors`}>Contributors</Link> ·{' '}
        <Link href={`${base}/product-tabs`}>Product details</Link> ·{' '}
        <Link href={`${base}/folder-tree`}>Files tree</Link> ·{' '}
        <Link href={`${base}/promotions`}>Promotions</Link> ·{' '}
        <Link href={`${base}/local-notes`}>Local notes</Link> ·{' '}
        <Link href={`${base}/letter`}>Letter</Link> ·{' '}
        <Link href={`${base}/share-recipe`}>Recipe</Link> ·{' '}
        <Link href={`${base}/photos`}>Photos</Link> ·{' '}
        <Link href={`${base}/delivery-form`}>Delivery details</Link> ·{' '}
        <Link href={`${base}/hotels`}>Hotels</Link> ·{' '}
        <Link href={`${base}/lamps`}>Lamps</Link> ·{' '}
        <Link href={`${base}/mailing-list`}>Mailing list</Link> ·{' '}
        <Link href={`${base}/trip-tags`}>Trip tags</Link> ·{' '}
        <Link href={`${base}/gig-tickets`}>Concert tickets</Link> ·{' '}
        <Link href={`${base}/privacy`}>Privacy settings</Link> ·{' '}
        <Link href={`${base}/train-ticket`}>Train ticket</Link> ·{' '}
        <Link href={`${base}/pancakes`}>Pancakes</Link> ·{' '}
        <Link href={`${base}/album`}>Photo album</Link> ·{' '}
        <Link href={`${base}/floor-plan`}>Floor plan</Link> ·{' '}
        <Link href={`${base}/reading-list`}>Reading list</Link> ·{' '}
        <Link href={`${base}/bus-stop`}>Bus stop</Link> ·{' '}
        <Link href={`${base}/workspace`}>Workspace</Link> ·{' '}
        <Link href={`${base}/saved-searches`}>Saved searches</Link> ·{' '}
        <Link href={`${base}/groceries`}>Groceries</Link> ·{' '}
        <Link href={`${base}/event-feedback`}>Event feedback</Link> ·{' '}
        <Link href={`${base}/shop-dashboard`}>Shop dashboard</Link> ·{' '}
        <Link href={`${base}/highlights`}>Highlights</Link> ·{' '}
        <Link href={`${base}/sell-bike`}>Sell your bike</Link> ·{' '}
        <Link href={`${base}/expense-claims`}>Expense claims</Link> ·{' '}
        <Link href={`${base}/flats`}>Flats</Link> ·{' '}
        <Link href={`${base}/parking`}>Parking permit</Link> ·{' '}
        <Link href={`${base}/drive`}>Shared drive</Link> ·{' '}
        <Link href={`${base}/village-hall`}>Village hall</Link> ·{' '}
        <Link href={`${base}/assistant`}>Assistant</Link> ·{' '}
        <Link href={`${base}/comments`}>Comments</Link> ·{' '}
        <Link href={`${base}/alert-settings`}>Alert settings</Link> ·{' '}
        <Link href={`${base}/choir`}>Choir sign-up</Link> ·{' '}
        <Link href={`${base}/shared-photos`}>Shared photos</Link> ·{' '}
        <Link href={`${base}/mail-reader`}>Mail reader</Link> ·{' '}
        <Link href={`${base}/receipts`}>Receipts</Link> ·{' '}
        <Link href={`${base}/guestbook`}>Guestbook</Link> ·{' '}
        <Link href={`${base}/poster`}>Concert poster</Link> ·{' '}
        <Link href={`${base}/field-notes`}>Field notes</Link> ·{' '}
        <Link href={`${base}/club-activity`}>Club activity</Link> ·{' '}
        <Link href={`${base}/notice-board`}>Notice board</Link> ·{' '}
        <Link href={`${base}/prints`}>Prints</Link> ·{' '}
        <Link href={`${base}/study-group`}>Study group</Link> ·{' '}
        <Link href={`${base}/billing-details`}>Billing details</Link> ·{' '}
        <Link href={`${base}/flight-search`}>Flight search</Link> ·{' '}
        <Link href={`${base}/bank-transfer`}>Bank transfer</Link> ·{' '}
        <Link href={`${base}/library-card`}>Library card</Link> ·{' '}
        <Link href={`${base}/fete`}>Village fête</Link> ·{' '}
        <Link href={`${base}/rooms`}>Rooms</Link> ·{' '}
        <Link href={`${base}/favourites`}>Radio favourites</Link> ·{' '}
        <Link href={`${base}/handover`}>Shift handover</Link> ·{' '}
        <Link href={`${base}/ticket-contact`}>Ticket contact</Link> ·{' '}
        <Link href={`${base}/handbook`}>Handbook</Link> ·{' '}
        <Link href={`${base}/barber`}>Barber</Link> ·{' '}
        <Link href={`${base}/running-order`}>Running order</Link> ·{' '}
        <Link href={`${base}/site-photos`}>Site photos</Link> ·{' '}
        <Link href={`${base}/staff`}>Staff</Link> ·{' '}
        <Link href={`${base}/answers`}>Support answers</Link> ·{' '}
        <Link href={`${base}/tile-order`}>Tile order</Link> ·{' '}
        <Link href={`${base}/shoe-size`}>Shoe size</Link> ·{' '}
        <Link href={`${base}/saved-cards`}>Saved cards</Link> ·{' '}
        <Link href={`${base}/stock-take`}>Stock take</Link> ·{' '}
        <Link href={`${base}/cookbook`}>Cookbook</Link> <span>Name: {name}</span> <NotificationsBadge sandbox={sandbox} />
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
      ) : page === 'podcast' ? (
        <Podcast sandbox={sandbox} />
      ) : page === 'bakery' ? (
        <SiteMenu />
      ) : page === 'session' ? (
        <IdleSession sandbox={sandbox} />
      ) : page === 'team' ? (
        <Team sandbox={sandbox} />
      ) : page === 'meetings' ? (
        <Meetings sandbox={sandbox} />
      ) : page === 'directory' ? (
        <Directory />
      ) : page === 'confirm-email' ? (
        <ConfirmEmail sandbox={sandbox} />
      ) : page === 'messages' ? (
        <Plurals sandbox={sandbox} />
      ) : page === 'passkeys' ? (
        <Passkeys sandbox={sandbox} />
      ) : page === 'delivery' ? (
        <Delivery sandbox={sandbox} />
      ) : page === 'import' ? (
        <Import sandbox={sandbox} />
      ) : page === 'packing' ? (
        <Packing />
      ) : page === 'help' ? (
        <Help sandbox={sandbox} />
      ) : page === 'review' ? (
        <Review />
      ) : page === 'report' ? (
        <Report />
      ) : page === 'upload' ? (
        <UploadPage sandbox={sandbox} />
      ) : page === 'ticket' ? (
        <Ticket sandbox={sandbox} />
      ) : page === 'timesheet' ? (
        <Timesheet />
      ) : page === 'shop-reviews' ? (
        <Embed />
      ) : page === 'country' ? (
        <Country />
      ) : page === 'appearance' ? (
        <Appearance sandbox={sandbox} />
      ) : page === 'statement' ? (
        <StatementPage sandbox={sandbox} />
      ) : page === 'plans' ? (
        <Plans />
      ) : page === 'price-alert' ? (
        <PriceAlert sandbox={sandbox} />
      ) : page === 'live-score' ? (
        <LiveScore sandbox={sandbox} />
      ) : page === 'mobile-inbox' ? (
        <MobileInbox />
      ) : page === 'password' ? (
        <ChangePassword sandbox={sandbox} />
      ) : page === 'flash-sale' ? (
        <FlashSale sandbox={sandbox} />
      ) : page === 'class-list' ? (
        <ClassList />
      ) : page === 'newsletter' ? (
        <Newsletter sandbox={sandbox} />
      ) : page === 'post-editor' ? (
        <PostEditor sandbox={sandbox} />
      ) : page === 'announcements' ? (
        <Announcements sandbox={sandbox} />
      ) : page === 'voice-note' ? (
        <VoiceNote sandbox={sandbox} />
      ) : page === 'price-list' ? (
        <PriceList sandbox={sandbox} />
      ) : page === 'contributors' ? (
        <Contributors />
      ) : page === 'product-tabs' ? (
        <ProductTabs />
      ) : page === 'folder-tree' ? (
        <FolderTree />
      ) : page === 'promotions' ? (
        <Promotions />
      ) : page === 'local-notes' ? (
        <LocalNotes sandbox={sandbox} />
      ) : page === 'letter' ? (
        <UndoEditor />
      ) : page === 'share-recipe' ? (
        <ShareRecipe />
      ) : page === 'photos' ? (
        <PhotoViewer />
      ) : page === 'delivery-form' ? (
        <DeliveryForm />
      ) : page === 'hotels' ? (
        <HotelSearch />
      ) : page === 'lamps' ? (
        <Lamps />
      ) : page === 'mailing-list' ? (
        <MailingList />
      ) : page === 'trip-tags' ? (
        <TripTags />
      ) : page === 'gig-tickets' ? (
        <GigTickets sandbox={sandbox} />
      ) : page === 'privacy' ? (
        <PrivacySettings />
      ) : page === 'train-ticket' ? (
        <TrainTicket />
      ) : page === 'pancakes' ? (
        <Pancakes />
      ) : page === 'album' ? (
        <FolderUpload sandbox={sandbox} />
      ) : page === 'floor-plan' ? (
        <FloorPlan />
      ) : page === 'reading-list' ? (
        <ReadingList sandbox={sandbox} />
      ) : page === 'bus-stop' ? (
        <BusStop sandbox={sandbox} />
      ) : page === 'workspace' ? (
        <Workspace sandbox={sandbox} />
      ) : page === 'saved-searches' ? (
        <SavedSearches sandbox={sandbox} />
      ) : page === 'groceries' ? (
        <Groceries />
      ) : page === 'event-feedback' ? (
        <EventFeedback sandbox={sandbox} />
      ) : page === 'shop-dashboard' ? (
        <OrdersWidget />
      ) : page === 'highlights' ? (
        <Highlights />
      ) : page === 'sell-bike' ? (
        <SellBike />
      ) : page === 'expense-claims' ? (
        <ExpenseClaims sandbox={sandbox} />
      ) : page === 'flats' ? (
        <Flats sandbox={sandbox} />
      ) : page === 'parking' ? (
        <Parking sandbox={sandbox} />
      ) : page === 'drive' ? (
        <Drive />
      ) : page === 'village-hall' ? (
        <VillageHall />
      ) : page === 'assistant' ? (
        <Assistant sandbox={sandbox} />
      ) : page === 'comments' ? (
        <Comments />
      ) : page === 'alert-settings' ? (
        <AlertSettings sandbox={sandbox} />
      ) : page === 'choir' ? (
        <ChoirSignup />
      ) : page === 'shared-photos' ? (
        <SharedPhotos />
      ) : page === 'mail-reader' ? (
        <MailReader sandbox={sandbox} />
      ) : page === 'receipts' ? (
        <Receipts />
      ) : page === 'guestbook' ? (
        <GuestbookLink sandbox={sandbox} />
      ) : page === 'poster' ? (
        <Poster sandbox={sandbox} />
      ) : page === 'field-notes' ? (
        <FieldNotes sandbox={sandbox} />
      ) : page === 'club-activity' ? (
        <ClubActivity sandbox={sandbox} />
      ) : page === 'notice-board' ? (
        <NoticeBoard sandbox={sandbox} />
      ) : page === 'prints' ? (
        <Prints sandbox={sandbox} />
      ) : page === 'study-group' ? (
        <StudyGroup sandbox={sandbox} name={name} />
      ) : page === 'billing-details' ? (
        <BillingDetails sandbox={sandbox} />
      ) : page === 'flight-search' ? (
        <FlightSearch sandbox={sandbox} />
      ) : page === 'bank-transfer' ? (
        <BankTransfer sandbox={sandbox} />
      ) : page === 'library-card' ? (
        <LibraryCard sandbox={sandbox} />
      ) : page === 'fete' ? (
        <Fete sandbox={sandbox} />
      ) : page === 'rooms' ? (
        <Rooms />
      ) : page === 'favourites' ? (
        <Favourites sandbox={sandbox} />
      ) : page === 'handover' ? (
        <Handover sandbox={sandbox} />
      ) : page === 'ticket-contact' ? (
        <TicketContact sandbox={sandbox} />
      ) : page === 'handbook' ? (
        <Handbook />
      ) : page === 'barber' ? (
        <Barber sandbox={sandbox} name={name} />
      ) : page === 'running-order' ? (
        <RunningOrder sandbox={sandbox} />
      ) : page === 'site-photos' ? (
        <SitePhotos />
      ) : page === 'staff' ? (
        <Staff sandbox={sandbox} />
      ) : page === 'answers' ? (
        <Answers />
      ) : page === 'tile-order' ? (
        <TileOrder sandbox={sandbox} />
      ) : page === 'shoe-size' ? (
        <ShoeSize />
      ) : page === 'saved-cards' ? (
        <SavedCards />
      ) : page === 'stock-take' ? (
        <StockTake />
      ) : page === 'cookbook' ? (
        <Cookbook />
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
        <li>
          <Link href={`${base}/podcast`}>Podcast</Link>: a 30-second episode with a transcript that follows along.
        </li>
        <li>
          <Link href={`${base}/bakery`}>Bakery</Link>: a small site header whose links fold into a Menu button on a narrow screen.
        </li>
        <li>
          <Link href={`${base}/session`}>Session</Link>: warns before signing you out after a while without activity.
        </li>
        <li>
          <Link href={`${base}/team`}>Team</Link>: a shared document whose members can view, edit or manage roles.
        </li>
        <li>
          <Link href={`${base}/meetings`}>Meetings</Link>: plan meetings, repeated weekly, seen by people in other time zones.
        </li>
        <li>
          <Link href={`${base}/directory`}>Directory</Link>: a list of 10,000 customers that stays fast by drawing only what you see.
        </li>
        <li>
          <Link href={`${base}/confirm-email`}>Confirm email</Link>: type, paste or autofill a 6-digit code, one box per digit.
        </li>
        <li>
          <Link href={`${base}/messages`}>Messages</Link>: count new messages in English or Polish, with the right word for every number.
        </li>
        <li>
          <Link href={`${base}/passkeys`}>Passkeys</Link>: create a passkey and sign in with it, no password.
        </li>
        <li>
          <Link href={`${base}/delivery`}>Delivery</Link>: sign for a parcel on a signature pad, or type your name.
        </li>
        <li>
          <Link href={`${base}/import`}>Import</Link>: import 100 customers and watch the progress live.
        </li>
        <li>
          <Link href={`${base}/packing`}>Packing list</Link>: a packing list where every change can be undone and redone.
        </li>
        <li>
          <Link href={`${base}/help`}>Help centre</Link>: help articles that open without reloading the page.
        </li>
        <li>
          <Link href={`${base}/review`}>Order review</Link>: a long order with a header and a pay bar that stay on screen.
        </li>
        <li>
          <Link href={`${base}/report`}>Sales report</Link>: a heavy report built in the background, with progress and cancel.
        </li>
        <li>
          <Link href={`${base}/upload`}>Upload</Link>: upload a large file with progress and cancel.
        </li>
        <li>
          <Link href={`${base}/ticket`}>Support ticket</Link>: describe a problem and paste screenshots into it.
        </li>
        <li>
          <Link href={`${base}/timesheet`}>Timesheet</Link>: a timesheet grid you can fill in with the keyboard.
        </li>
        <li>
          <Link href={`${base}/shop-reviews`}>Shop reviews</Link>: a reviews widget in a frame that sizes itself.
        </li>
        <li>
          <Link href={`${base}/country`}>Country</Link>: pick a country from a list by typing its first letters.
        </li>
        <li>
          <Link href={`${base}/appearance`}>Appearance</Link>: choose a light or dark theme and less motion, or follow your device.
        </li>
        <li>
          <Link href={`${base}/statement`}>Statement</Link>: see a month of transactions and download them as a CSV file.
        </li>
        <li>
          <Link href={`${base}/plans`}>Plans</Link>: compare three plans, with a tooltip on each info button.
        </li>
        <li>
          <Link href={`${base}/price-alert`}>Price alerts</Link>: get a browser notification when the headphones get cheaper.
        </li>
        <li>
          <Link href={`${base}/live-score`}>Live score</Link>: follow a match score that saves requests while you look away.
        </li>
        <li>
          <Link href={`${base}/mobile-inbox`}>Mobile inbox</Link>: delete a message by swiping it, or with its Delete button, and undo it.
        </li>
        <li>
          <Link href={`${base}/password`}>Change password</Link>: change the account password, with show and hide.
        </li>
        <li>
          <Link href={`${base}/flash-sale`}>Flash sale</Link>: count down to the end of a sale by the shop's clock.
        </li>
        <li>
          <Link href={`${base}/class-list`}>Class list</Link>: sort and search a class of Polish pupils.
        </li>
        <li>
          <Link href={`${base}/newsletter`}>Newsletter</Link>: mark articles as read once you have actually looked at them.
        </li>
        <li>
          <Link href={`${base}/post-editor`}>Post editor</Link>: write and publish a blog post in a panel that scrolls.
        </li>
        <li>
          <Link href={`${base}/announcements`}>Announcements</Link>: dismiss announcement banners that fade out.
        </li>
        <li>
          <Link href={`${base}/voice-note`}>Voice note</Link>: record a voice note with the microphone and play it back.
        </li>
        <li>
          <Link href={`${base}/price-list`}>Price list</Link>: check a price list without downloading it again when nothing changed.
        </li>
        <li>
          <Link href={`${base}/contributors`}>Contributors</Link>: read long names that do not fit on their cards.
        </li>
        <li>
          <Link href={`${base}/product-tabs`}>Product details</Link>: switch between product details with tabs, by mouse or keyboard.
        </li>
        <li>
          <Link href={`${base}/folder-tree`}>Files tree</Link>: browse folders in a tree with the mouse or the keyboard.
        </li>
        <li>
          <Link href={`${base}/promotions`}>Promotions</Link>: a carousel of offers that changes by itself and can be stopped.
        </li>
        <li>
          <Link href={`${base}/local-notes`}>Local notes</Link>: keep notes in this browser, and survive an update while another tab is open.
        </li>
        <li>
          <Link href={`${base}/letter`}>Letter</Link>: write a letter with Undo and Redo that work word by word.
        </li>
        <li>
          <Link href={`${base}/share-recipe`}>Recipe</Link>: share a recipe with the device's share sheet, or copy its link.
        </li>
        <li>
          <Link href={`${base}/photos`}>Photos</Link>: view photos in full screen, with a fallback when full screen is not allowed.
        </li>
        <li>
          <Link href={`${base}/delivery-form`}>Delivery details</Link>: a delivery form that works on a very narrow screen and with large text.
        </li>
        <li>
          <Link href={`${base}/hotels`}>Hotels</Link>: a hotel list with a full-window Filters sheet under a frosted toolbar.
        </li>
        <li>
          <Link href={`${base}/lamps`}>Lamps</Link>: product cards whose quick actions must work with a mouse, a keyboard and a touch screen.
        </li>
        <li>
          <Link href={`${base}/mailing-list`}>Mailing list</Link>: a sign-up form wired up by a separate script that loads after the page.
        </li>
        <li>
          <Link href={`${base}/trip-tags`}>Trip tags</Link>: a tag input that has to work with input methods for Japanese, Chinese and accents.
        </li>
        <li>
          <Link href={`${base}/gig-tickets`}>Concert tickets</Link>: a ticket purchase that leaves for a receipt page and has to be right when the user comes Back.
        </li>
        <li>
          <Link href={`${base}/privacy`}>Privacy settings</Link>: settings with pop-up hints next to each option and a short confirmation after saving.
        </li>
        <li>
          <Link href={`${base}/train-ticket`}>Train ticket</Link>: a three-step ticket purchase with optional extras.
        </li>
        <li>
          <Link href={`${base}/pancakes`}>Pancakes</Link>: a recipe that scales with the number of servings and checks how much flour you have.
        </li>
        <li>
          <Link href={`${base}/album`}>Photo album</Link>: an album that uploads a whole folder of photos at once.
        </li>
        <li>
          <Link href={`${base}/floor-plan`}>Floor plan</Link>: a floor plan that zooms with two fingers, Ctrl and the wheel, or buttons.
        </li>
        <li>
          <Link href={`${base}/reading-list`}>Reading list</Link>: a signed-in reading list whose session is kept in the browser's IndexedDB.
        </li>
        <li>
          <Link href={`${base}/bus-stop`}>Bus stop</Link>: a departures board that keeps working offline through a service worker.
        </li>
        <li>
          <Link href={`${base}/workspace`}>Workspace</Link>: a workspace that sends unfinished workspaces to Setup and finished ones to the Dashboard.
        </li>
        <li>
          <Link href={`${base}/saved-searches`}>Saved searches</Link>: a list of saved searches with an empty state for new users.
        </li>
        <li>
          <Link href={`${base}/groceries`}>Groceries</Link>: a shopping basket whose changes are announced to screen readers.
        </li>
        <li>
          <Link href={`${base}/event-feedback`}>Event feedback</Link>: a feedback form with a star rating built as a custom element.
        </li>
        <li>
          <Link href={`${base}/shop-dashboard`}>Shop dashboard</Link>: a dashboard widget that changes layout with its own width, not the window's.
        </li>
        <li>
          <Link href={`${base}/highlights`}>Highlights</Link>: an article where selected text can be saved as a highlight.
        </li>
        <li>
          <Link href={`${base}/sell-bike`}>Sell your bike</Link>: a listing form whose Publish button explains why it is not ready yet.
        </li>
        <li>
          <Link href={`${base}/expense-claims`}>Expense claims</Link>: expense claims behind a sign-in, where a session can end while you type.
        </li>
        <li>
          <Link href={`${base}/flats`}>Flats</Link>: flats to rent as cards you can open, save and compare.
        </li>
        <li>
          <Link href={`${base}/parking`}>Parking permit</Link>: pay for a parking permit with card details in an embedded payment frame.
        </li>
        <li>
          <Link href={`${base}/drive`}>Shared drive</Link>: files with a right-click menu that also opens from the keyboard.
        </li>
        <li>
          <Link href={`${base}/village-hall`}>Village hall</Link>: questions and answers whose closed answers can still be found and linked to.
        </li>
        <li>
          <Link href={`${base}/assistant`}>Assistant</Link>: three conversations with an assistant whose answers arrive word by word.
        </li>
        <li>
          <Link href={`${base}/comments`}>Comments</Link>: a comment box that grows with what you write.
        </li>
        <li>
          <Link href={`${base}/alert-settings`}>Alert settings</Link>: switches and a summary choice that must stay readable in high-contrast mode.
        </li>
        <li>
          <Link href={`${base}/choir`}>Choir sign-up</Link>: a sign-up form that changes layout when a phone is turned.
        </li>
        <li>
          <Link href={`${base}/shared-photos`}>Shared photos</Link>: a photo grid where pressing and holding a photo starts selecting.
        </li>
        <li>
          <Link href={`${base}/mail-reader`}>Mail reader</Link>: a message list and a message, with a divider you can drag.
        </li>
        <li>
          <Link href={`${base}/receipts`}>Receipts</Link>: receipts dragged from the computer onto a drop area.
        </li>
        <li>
          <Link href={`${base}/guestbook`}>Guestbook</Link>: a plain HTML guestbook that works without JavaScript.
        </li>
        <li>
          <Link href={`${base}/poster`}>Concert poster</Link>: a poster whose headline shrinks to fit on one line.
        </li>
        <li>
          <Link href={`${base}/field-notes`}>Field notes</Link>: notes kept in the browser, also when its storage is full.
        </li>
        <li>
          <Link href={`${base}/club-activity`}>Club activity</Link>: what happened in the tennis club, with times like "3 minutes ago".
        </li>
        <li>
          <Link href={`${base}/notice-board`}>Notice board</Link>: office notices that count as read once you have actually seen them.
        </li>
        <li>
          <Link href={`${base}/prints`}>Prints</Link>: connect a photo account in a pop-up window.
        </li>
        <li>
          <Link href={`${base}/study-group`}>Study group</Link>: a group chat that shows who is typing.
        </li>
        <li>
          <Link href={`${base}/billing-details`}>Billing details</Link>: billing details for a private person or a company.
        </li>
        <li>
          <Link href={`${base}/flight-search`}>Flight search</Link>: a flight search that can be slow, with Cancel.
        </li>
        <li>
          <Link href={`${base}/bank-transfer`}>Bank transfer</Link>: an account number that formats itself as you type.
        </li>
        <li>
          <Link href={`${base}/library-card`}>Library card</Link>: a date of birth typed by hand, and an age that depends on today.
        </li>
        <li>
          <Link href={`${base}/fete`}>Village fête</Link>: a reply form that works before its script has loaded.
        </li>
        <li>
          <Link href={`${base}/rooms`}>Rooms</Link>: room photos that load the right size for each screen.
        </li>
        <li>
          <Link href={`${base}/favourites`}>Radio favourites</Link>: like buttons that stay right however fast you click.
        </li>
        <li>
          <Link href={`${base}/handover`}>Shift handover</Link>: a note where @ suggests people to mention.
        </li>
        <li>
          <Link href={`${base}/ticket-contact`}>Ticket contact</Link>: contact details that the browser can fill in for you.
        </li>
        <li>
          <Link href={`${base}/handbook`}>Handbook</Link>: a staff handbook menu that shows where the keyboard is.
        </li>
        <li>
          <Link href={`${base}/barber`}>Barber</Link>: book a haircut; the time you choose is held for 5 minutes.
        </li>
        <li>
          <Link href={`${base}/running-order`}>Running order</Link>: a long list you reorder by dragging, which scrolls while you drag.
        </li>
        <li>
          <Link href={`${base}/site-photos`}>Site photos</Link>: a file table sorted by name, size or date, with numbers in names.
        </li>
        <li>
          <Link href={`${base}/staff`}>Staff</Link>: an edit dialog that loads details while you move focus.
        </li>
        <li>
          <Link href={`${base}/answers`}>Support answers</Link>: search with highlighted matches, accents and special characters.
        </li>
        <li>
          <Link href={`${base}/tile-order`}>Tile order</Link>: an order that belongs to one browser tab.
        </li>
        <li>
          <Link href={`${base}/shoe-size`}>Shoe size</Link>: a custom select whose list opens over its own button.
        </li>
        <li>
          <Link href={`${base}/saved-cards`}>Saved cards</Link>: a confirm question you can reopen while it fades out.
        </li>
        <li>
          <Link href={`${base}/stock-take`}>Stock take</Link>: a grid you fill by pasting cells from a spreadsheet.
        </li>
        <li>
          <Link href={`${base}/cookbook`}>Cookbook</Link>: dialogs over a long page that must not scroll or move behind them.
        </li>
      </ul>
    </section>
  );
}
