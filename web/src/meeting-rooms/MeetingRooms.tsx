import { useEffect, useState } from 'react';

type Slot = { time: string; booked: boolean };

export function MeetingRooms({ sandbox }: { sandbox: string }) {
  const base = `/api/s/${sandbox}`;
  const [slots, setSlots] = useState<Slot[]>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ id: string; time: string } | null>(null);

  async function refresh() {
    try {
      const res = await fetch(`${base}/rooms`);
      if (!res.ok) return false;
      setSlots(((await res.json()) as { slots: Slot[] }).slots);
      return true;
    } catch {
      return false;
    }
  }

  async function sendInvite(id: string) {
    try {
      return (await fetch(`${base}/room-bookings/${id}/invite`, { method: 'POST' })).ok;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    void refresh();
  }, [sandbox]);

  async function book(time: string) {
    setBusy(true);
    setStatus(`Booking ${time}…`);
    let id: string;
    try {
      const res = await fetch(`${base}/room-bookings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ time }),
      });
      if (!res.ok) {
        setStatus(res.status === 409 ? `${time} is already taken.` : 'Could not book the room. Nothing was booked.');
        setBusy(false);
        return;
      }
      id = ((await res.json()) as { id: string }).id;
    } catch {
      setStatus('Could not reach the server. Check the list before trying again.');
      setBusy(false);
      return;
    }
    setSlots((list) => list.map((s) => (s.time === time ? { ...s, booked: true } : s)));
    const inviteOk = await sendInvite(id);
    const listOk = await refresh();
    setPending(inviteOk ? null : { id, time });
    setStatus(
      `Room booked for ${time}.` +
        (inviteOk ? ' Invite sent.' : ' The calendar invite could not be sent.') +
        (listOk ? '' : ' The list could not be refreshed.'),
    );
    setBusy(false);
  }

  async function resend(p: { id: string; time: string }) {
    setBusy(true);
    const ok = await sendInvite(p.id);
    setPending(ok ? null : p);
    setStatus(ok ? `Invite sent for ${p.time}.` : 'The calendar invite could not be sent.');
    setBusy(false);
  }

  return (
    <section className="meeting-rooms">
      <h1>Meeting rooms</h1>
      <h2>Blue room, today</h2>
      <ul aria-label="Times">
        {slots.map((s) => (
          <li key={s.time}>
            {s.time}, {s.booked ? 'booked' : 'free'}{' '}
            {!s.booked && (
              <button type="button" disabled={busy} onClick={() => void book(s.time)}>
                Book {s.time}
              </button>
            )}
          </li>
        ))}
      </ul>
      <p role="status">{status}</p>
      {pending && (
        <button type="button" disabled={busy} onClick={() => void resend(pending)}>
          Send invite again
        </button>
      )}
    </section>
  );
}
