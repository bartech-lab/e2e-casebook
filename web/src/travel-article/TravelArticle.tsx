import { useEffect, useState } from 'react';
import { json } from '../http.ts';

const PHOTOS = [
  { n: 1, width: 800, height: 500, alt: 'Fishing boats in the harbour of Hel' },
  { n: 2, width: 800, height: 600, alt: 'The lighthouse at dusk' },
  { n: 3, width: 800, height: 450, alt: 'Dunes and pines on the open-sea side' },
];
const TEXT = [
  'The train from Gdynia takes two hours and stops in every fishing village on the way. Sit on the left for the bay.',
  'Rent a bike in Jastarnia: the path runs between the forest and the beach, and it is flat all the way to Hel.',
  'Climb the lighthouse an hour before sunset. The stairs are steep, and the view of both seas is worth it.',
  'On the last day, walk to the very tip of the peninsula, where the Baltic meets the bay, and eat smoked fish on the pier.',
];

function Photo({ sandbox, n, width, height, alt }: (typeof PHOTOS)[number] & { sandbox: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <figure className="travel-photo">
      <div className="photo-frame" style={{ aspectRatio: `${width} / ${height}` }}>
        {broken ? (
          <p className="photo-missing">{alt}</p>
        ) : (
          <img src={`/api/s/${sandbox}/travel-photos/${n}`} width={width} height={height} alt={alt} onError={() => setBroken(true)} />
        )}
      </div>
    </figure>
  );
}

export function TravelArticle({ sandbox }: { sandbox: string }) {
  const [offer, setOffer] = useState('');

  useEffect(() => {
    void fetch(`/api/s/${sandbox}/newsletter-offer`)
      .then((res) => json<{ text: string }>(res))
      .then(({ text }) => setOffer(text));
  }, [sandbox]);

  return (
    <article className="travel-article">
      <h1>Three days on the Hel Peninsula</h1>
      <p>{TEXT[0]}</p>
      <Photo sandbox={sandbox} {...PHOTOS[0]!} />
      <aside aria-label="Newsletter" className="newsletter-slot">
        {offer && (
          <>
            <p>{offer}</p>
            <button type="button">Subscribe</button>
          </>
        )}
      </aside>
      <p>{TEXT[1]}</p>
      <Photo sandbox={sandbox} {...PHOTOS[1]!} />
      <p>{TEXT[2]}</p>
      <Photo sandbox={sandbox} {...PHOTOS[2]!} />
      <p>{TEXT[3]}</p>
    </article>
  );
}
