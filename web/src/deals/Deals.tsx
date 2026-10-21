import { useEffect, useRef, useState } from 'react';
import { ConsentBanner, readConsent, type Consent } from './consent-banner.ts';

const PICKED = ['Notebook: 2 for 22.00 PLN', 'Pen: a second pen for 1.99 PLN', 'Backpack: free shipping insurance'];

export function Deals({ sandbox }: { sandbox: string }) {
  const [consent, setConsent] = useState<Consent | null>(() => readConsent(sandbox));
  const slot = useRef<HTMLDivElement>(null);
  const banner = useRef<ConsentBanner | null>(null);

  useEffect(() => {
    const el = document.createElement('consent-banner') as ConsentBanner;
    el.setAttribute('sandbox', sandbox);
    const onConsent = (e: Event) => setConsent((e as CustomEvent<Consent>).detail);
    el.addEventListener('consent', onConsent);
    slot.current?.append(el);
    banner.current = el;
    return () => {
      el.removeEventListener('consent', onConsent);
      el.remove();
    };
  }, [sandbox]);

  return (
    <section>
      <h1>Deals</h1>
      {consent === 'all' ? (
        <>
          <h2>Picked for you</h2>
          <ul aria-label="Picked for you">
            {PICKED.map((deal) => (
              <li key={deal}>{deal}</li>
            ))}
          </ul>
        </>
      ) : (
        <p>Personalised deals are off. Allow cookies in the banner to see deals picked for you.</p>
      )}
      <button type="button" onClick={() => banner.current?.open()}>
        Cookie settings
      </button>
      <div ref={slot} />
    </section>
  );
}
