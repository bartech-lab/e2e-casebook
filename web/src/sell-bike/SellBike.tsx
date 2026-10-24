import { useState } from 'react';

export function SellBike() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [photo, setPhoto] = useState(false);
  const [tip, setTip] = useState(false);
  const [listed, setListed] = useState(false);

  const missing = [!title.trim() && 'a title', !/^\d+$/.test(price.trim()) && 'a price', !photo && 'a photo'].filter(Boolean) as string[];
  const ready = missing.length === 0;
  const reason = ready ? '' : `To publish, add: ${missing.join(', ')}.`;

  if (listed) return (
    <section>
      <h1>Sell your bike</h1>
      <p role="status">Your bike is listed.</p>
    </section>
  );

  return (
    <section>
      <h1>Sell your bike</h1>
      <form className="sell-form" onSubmit={(e) => e.preventDefault()}>
        <label>
          Title <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          Price in PLN <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label>
          <input type="checkbox" checked={photo} onChange={(e) => setPhoto(e.target.checked)} /> Photo added
        </label>
        <div className="sell-publish">
          <button
            type="button"
            aria-disabled={!ready}
            aria-describedby={ready ? undefined : 'sell-reason'}
            className={ready ? undefined : 'looks-disabled'}
            onMouseEnter={() => setTip(true)}
            onMouseLeave={() => setTip(false)}
            onFocus={() => setTip(true)}
            onBlur={() => setTip(false)}
            onClick={() => ready && setListed(true)}
          >
            Publish
          </button>
          <span id="sell-reason" className="sell-tip" hidden={ready || !tip}>
            {reason}
          </span>
        </div>
      </form>
    </section>
  );
}
