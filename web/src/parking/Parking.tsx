import { useEffect, useRef, useState } from 'react';

const AMOUNT = 120;

export function Parking({ sandbox }: { sandbox: string }) {
  const [plate, setPlate] = useState('');
  const [plateError, setPlateError] = useState('');
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState<{ plate: string; id: string } | null>(null);
  const [height, setHeight] = useState(150);
  const frame = useRef<HTMLIFrameElement>(null);
  const paying = useRef('');

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== frame.current?.contentWindow || e.data?.source !== 'pay-frame') return;
      if (e.data.type === 'height' && typeof e.data.px === 'number') setHeight(e.data.px);
      else if (e.data.type === 'paid' && typeof e.data.id === 'string') {
        setPaid({ plate: paying.current, id: e.data.id });
        setBusy(false);
      } else if (e.data.type === 'error') setBusy(false);
    };
    addEventListener('message', onMessage);
    return () => removeEventListener('message', onMessage);
  }, []);

  function pay() {
    const p = plate.trim().toUpperCase();
    if (!p) {
      setPlateError('Enter your number plate.');
      return;
    }
    setPlateError('');
    setBusy(true);
    paying.current = p;
    frame.current?.contentWindow?.postMessage({ type: 'submit' }, location.origin);
  }

  if (paid)
    return (
      <section>
        <h1>Parking permit</h1>
        <p role="status">
          The permit for {paid.plate} is paid. Payment {paid.id}.
        </p>
      </section>
    );

  return (
    <section>
      <h1>Parking permit</h1>
      <p>A resident's permit for one month costs {AMOUNT.toFixed(2)} PLN.</p>
      <label>
        Number plate <input value={plate} onChange={(e) => setPlate(e.target.value)} />
      </label>
      {plateError && <p role="alert">{plateError}</p>}
      <iframe
        ref={frame}
        title="Card details"
        className="pay-frame"
        src={`/embed/pay/index.html?sandbox=${encodeURIComponent(sandbox)}&amount=${AMOUNT}`}
        style={{ height }}
      />
      <button type="button" disabled={busy} onClick={pay}>
        Pay {AMOUNT.toFixed(2)} PLN
      </button>
    </section>
  );
}
