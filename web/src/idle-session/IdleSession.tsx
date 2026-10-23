import { useEffect, useRef, useState } from 'react';

const IDLE = 60_000;
const WARN = 30_000;
type Message = { type: 'active'; at: number } | { type: 'out' };

export function IdleSession({ sandbox }: { sandbox: string }) {
  const [signedIn, setSignedIn] = useState(true);
  const [now, setNow] = useState(Date.now);
  const [lastActive, setLastActive] = useState(Date.now);
  const channel = useRef<BroadcastChannel>(null);
  const stay = useRef<HTMLButtonElement>(null);

  const left = IDLE + WARN - (now - lastActive);
  const warning = signedIn && now - lastActive >= IDLE;

  useEffect(() => {
    const ch = new BroadcastChannel(`idle:${sandbox}`);
    channel.current = ch;
    ch.onmessage = (e: MessageEvent<Message>) => {
      if (e.data.type === 'out') setSignedIn(false);
      else {
        const { at } = e.data;
        setLastActive((last) => Math.max(last, at));
      }
    };
    return () => ch.close();
  }, [sandbox]);

  useEffect(() => {
    if (!signedIn) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [signedIn]);

  useEffect(() => {
    if (signedIn && left <= 0) {
      setSignedIn(false);
      channel.current?.postMessage({ type: 'out' } satisfies Message);
    }
  }, [signedIn, left]);

  function active() {
    const at = Date.now();
    setLastActive(at);
    setNow(at);
    channel.current?.postMessage({ type: 'active', at } satisfies Message);
  }

  useEffect(() => {
    if (!signedIn || warning) return;
    const events = ['pointerdown', 'keydown', 'wheel'] as const;
    events.forEach((e) => addEventListener(e, active));
    return () => events.forEach((e) => removeEventListener(e, active));
  }, [signedIn, warning]);

  useEffect(() => {
    if (warning) stay.current?.focus();
  }, [warning]);

  if (!signedIn)
    return (
      <section>
        <h1>Session</h1>
        <p role="status">You were signed out after 90 seconds without activity.</p>
        <button
          type="button"
          onClick={() => {
            setSignedIn(true);
            active();
          }}
        >
          Sign in again
        </button>
      </section>
    );

  return (
    <section>
      <h1>Session</h1>
      <p>Signed in. You are signed out after 90 seconds without activity.</p>
      <label>
        Notes
        <textarea rows={4} />
      </label>
      {warning && (
        <div className="modal-backdrop">
          <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="idle-title" aria-describedby="idle-left">
            <h2 id="idle-title">Are you still there?</h2>
            <p id="idle-left">You will be signed out in {Math.ceil(left / 1000)} seconds.</p>
            <button ref={stay} type="button" onClick={active}>
              Stay signed in
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
