import { useRef, useState, type KeyboardEvent } from 'react';

const TABS = [
  { id: 'description', label: 'Description', body: 'A hand grinder with ceramic burrs and 40 grind settings.' },
  { id: 'specs', label: 'Specifications', body: 'Weight 620 g. Capacity 30 g. Burrs 38 mm, ceramic.' },
  { id: 'reviews', label: 'Reviews', body: '4.6 out of 5 from 212 reviews.' },
  { id: 'shipping', label: 'Shipping', body: 'Ships in 2 working days. Free returns for 30 days.' },
];

const fromHash = () => {
  const id = location.hash.slice(1);
  return TABS.some((t) => t.id === id) ? id : TABS[0]!.id;
};

export function ProductTabs() {
  const [selected, setSelected] = useState(fromHash);
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function select(id: string, focus: boolean) {
    setSelected(id);
    history.replaceState(null, '', `#${id}`);
    if (focus) refs.current[id]?.focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    const i = TABS.findIndex((t) => t.id === selected);
    const last = TABS.length - 1;
    const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(TABS[next]!.id, true);
  }

  return (
    <section>
      <h1>Hand grinder</h1>
      <div role="tablist" aria-label="Product details" className="tabs" onKeyDown={onKeyDown}>
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={t.id === selected}
            aria-controls={`panel-${t.id}`}
            tabIndex={t.id === selected ? 0 : -1}
            onClick={() => select(t.id, false)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {TABS.map((t) => (
        <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} tabIndex={0} hidden={t.id !== selected} className="tab-panel">
          <p>{t.body}</p>
        </div>
      ))}
      <p>
        <a href="#top">Back to top</a>
      </p>
    </section>
  );
}
