import { useEffect, useRef, useState } from 'react';

type Card = { id: string; label: string };
const CARDS: Card[] = [
  { id: 'c1', label: 'Visa ending 4242' },
  { id: 'c2', label: 'Mastercard ending 5100' },
  { id: 'c3', label: 'Visa ending 0005' },
  { id: 'c4', label: 'Maestro ending 6759' },
  { id: 'c5', label: 'Visa ending 1881' },
];
const FADE_MS = 300;

export function SavedCards() {
  const [cards, setCards] = useState(CARDS);
  const [dialog, setDialog] = useState<{ id: string; label: string; closing: boolean } | null>(null);
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const returnTo = useRef<string | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const keepButton = useRef<HTMLButtonElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (dialog && !dialog.closing) keepButton.current?.focus();
  }, [dialog]);

  function ask(card: Card) {
    clearTimeout(timer.current);
    returnTo.current = card.id;
    setDialog({ id: card.id, label: card.label, closing: false });
  }

  function close(focusId: string | null) {
    setDialog((d) => (d ? { ...d, closing: true } : d));
    if (focusId) buttons.current.get(focusId)?.focus();
    else document.getElementById('saved-cards-title')?.focus();
    timer.current = setTimeout(() => {
      setDialog(null);
      returnTo.current = null;
    }, FADE_MS);
  }

  function cancel() {
    if (!dialog || dialog.closing) return;
    close(returnTo.current);
  }

  function confirm() {
    if (!dialog || dialog.closing) return;
    const i = cards.findIndex((c) => c.id === dialog.id);
    const card = cards[i]!;
    const rest = cards.filter((c) => c.id !== card.id);
    setCards(rest);
    setMessage(`Removed ${card.label}.`);
    close((rest[i] ?? rest[i - 1])?.id ?? null);
  }

  return (
    <section>
      <h1 id="saved-cards-title" tabIndex={-1}>
        Saved cards
      </h1>
      {cards.length ? (
        <ul aria-label="Saved cards">
          {cards.map((c) => (
            <li key={c.id}>
              {c.label}{' '}
              <button
                type="button"
                ref={(el) => {
                  if (el) buttons.current.set(c.id, el);
                  else buttons.current.delete(c.id);
                }}
                onClick={() => ask(c)}
              >
                Remove {c.label}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No saved cards.</p>
      )}
      <p role="status">{message}</p>
      {dialog && (
        <div className={`modal-backdrop fade${dialog.closing ? ' closing' : ''}`}>
          <div
            className="modal"
            role="alertdialog"
            aria-modal={!dialog.closing}
            aria-labelledby="remove-card-title"
            inert={dialog.closing}
            onKeyDown={(e) => {
              if (e.key === 'Escape') cancel();
            }}
          >
            <h2 id="remove-card-title">Remove {dialog.label}?</h2>
            <button type="button" onClick={confirm}>
              Remove
            </button>{' '}
            <button type="button" ref={keepButton} onClick={cancel}>
              Keep it
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
