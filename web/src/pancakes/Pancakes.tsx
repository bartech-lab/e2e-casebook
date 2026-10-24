import { useEffect, useRef, useState } from 'react';

const BASE = 4;
const FLOUR_PER_SERVING = 0.0625;
const INGREDIENTS = [
  ['Flour', 250, 'g'],
  ['Milk', 500, 'ml'],
  ['Eggs', 2, ''],
  ['Butter', 30, 'g'],
] as const;
const STEPS = [
  'Whisk the flour, milk and eggs until smooth, then rest the batter for 20 minutes.',
  'Melt the butter in a wide pan over medium heat and pour most of it into the batter.',
  'Pour a thin layer of batter into the hot pan and tilt it so the batter covers the base.',
  'Cook for about a minute, until the edges lift, then turn the pancake over.',
  'Cook the other side for 30 seconds and keep the pancakes warm under a cloth.',
  'Serve with jam, cottage cheese, or apples fried in butter and cinnamon.',
];
const amount = (base: number, servings: number) => {
  const v = (base * servings) / BASE;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};

export function Pancakes() {
  const [servingsText, setServingsText] = useState(String(BASE));
  const [servings, setServings] = useState(BASE);
  const [flourText, setFlourText] = useState('');
  const servingsInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = servingsInput.current!;
    const onWheel = (e: WheelEvent) => {
      if (document.activeElement !== input) return;
      e.preventDefault();
      window.scrollBy(0, e.deltaY);
    };
    input.addEventListener('wheel', onWheel, { passive: false });
    return () => input.removeEventListener('wheel', onWheel);
  }, []);

  function changeServings(text: string) {
    setServingsText(text);
    const n = Number(text);
    if (text !== '' && Number.isInteger(n) && n >= 1 && n <= 12) setServings(n);
  }

  const shownValid = servingsText !== '' && Number(servingsText) === servings;
  const flour = flourText.trim() === '' ? null : Number(flourText.trim().replace(',', '.'));
  const flourValid = flour !== null && Number.isFinite(flour) && flour > 0;

  return (
    <section className="pancakes">
      <h1>Pancakes</h1>
      <p>Thin Polish pancakes (naleśniki). The recipe is written for 4 servings.</p>
      <label>
        Servings{' '}
        <input ref={servingsInput} type="number" min={1} max={12} step={1} value={servingsText} onChange={(e) => changeServings(e.target.value)} />
      </label>
      <p role="alert">{shownValid ? '' : 'Choose 1 to 12 servings.'}</p>
      <h2>Ingredients for {servings === 1 ? '1 serving' : `${servings} servings`}</h2>
      <ul aria-label="Ingredients">
        {INGREDIENTS.map(([name, base, unit]) => (
          <li key={name}>
            {name}: {amount(base, servings)}
            {unit && ` ${unit}`}
          </li>
        ))}
      </ul>
      <label>
        Flour you have, in kg{' '}
        <input type="text" inputMode="decimal" value={flourText} onChange={(e) => setFlourText(e.target.value)} />
      </label>
      <p role="status">
        {flour === null ? '' : flourValid ? `Enough flour for ${Math.floor(flour / FLOUR_PER_SERVING + 1e-9)} servings.` : 'Enter the flour in kg, for example 1,5.'}
      </p>
      <h2>Method</h2>
      <ol>
        {STEPS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </section>
  );
}
