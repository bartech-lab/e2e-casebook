import { useEffect, useRef, useState } from 'react';

const REVIEWS = [
  'Arrived a day early and the box was packed with care, nothing was broken.',
  'The coffee is excellent, though I wish the bag had a resealable zip.',
  'Customer support answered within an hour and replaced the damaged jar.',
  'Good value for the price, I will order again next month for the office.',
  'The delivery driver called ahead, which helped because I work from home.',
  'Fresh bread on Saturday morning is the best part of my week, thank you.',
  'Prices went up a little, but the quality is still worth it for me.',
];

const WIDGET = `<!doctype html>
<html><head><meta charset="utf-8"><style>
body { font-family: system-ui, sans-serif; margin: 12px; }
h2 { font-size: 1.1rem; margin: 0 0 8px; }
li { margin: 6px 0; line-height: 1.4; }
</style></head><body>
<h2>What customers say</h2>
<ul id="list"></ul>
<button id="more" type="button">Show more reviews</button>
<script>
const all = ${JSON.stringify(REVIEWS)};
let shown = 2;
const list = document.getElementById('list');
const more = document.getElementById('more');
function render() {
  list.innerHTML = all.slice(0, shown).map((r) => '<li>' + r + '</li>').join('');
  more.hidden = shown >= all.length;
}
more.onclick = () => { shown += 3; render(); };
render();
const send = () => parent.postMessage({ type: 'reviews:resize', height: document.documentElement.getBoundingClientRect().height }, '*');
new ResizeObserver(send).observe(document.documentElement);
send();
</script>
</body></html>`;

const MIN = 50;
const MAX = 2000;

export function Embed() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(150);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const data = e.data as { type?: unknown; height?: unknown } | null;
      if (data?.type !== 'reviews:resize' || typeof data.height !== 'number' || !Number.isFinite(data.height)) return;
      setHeight(Math.min(MAX, Math.max(MIN, Math.ceil(data.height))));
    };
    addEventListener('message', onMessage);
    return () => removeEventListener('message', onMessage);
  }, []);

  return (
    <section>
      <h1>Shop reviews</h1>
      <p>Reviews come from a widget in a sandboxed frame. The frame should always fit them.</p>
      <iframe ref={frame} title="Customer reviews" sandbox="allow-scripts" srcDoc={WIDGET} className="embed" style={{ height }} />
    </section>
  );
}
