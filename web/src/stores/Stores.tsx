import { useState } from 'react';

type Point = { lat: number; lon: number };
type Store = Point & { name: string };

const STORES: Store[] = [
  { name: 'Warszawa Centrum', lat: 52.2297, lon: 21.0122 },
  { name: 'Warszawa Mokotów', lat: 52.1935, lon: 21.045 },
  { name: 'Kraków Rynek', lat: 50.0617, lon: 19.9373 },
  { name: 'Gdańsk Główne', lat: 54.352, lon: 18.6466 },
  { name: 'Poznań Stary Rynek', lat: 52.4084, lon: 16.9342 },
];

const CITIES: Record<string, Point> = {
  Gdańsk: { lat: 54.352, lon: 18.6466 },
  Kraków: { lat: 50.0647, lon: 19.945 },
  Poznań: { lat: 52.4064, lon: 16.9252 },
  Warszawa: { lat: 52.2297, lon: 21.0122 },
  Wrocław: { lat: 51.1079, lon: 17.0385 },
};

const rad = (deg: number) => (deg * Math.PI) / 180;

function km(a: Point, b: Point) {
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function nearest(from: Point) {
  return STORES.map((s) => ({ name: s.name, km: km(from, s) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 3);
}

export function Stores() {
  const [from, setFrom] = useState<{ point: Point; label: string } | null>(null);
  const [message, setMessage] = useState('');

  function locate() {
    setMessage('Finding you…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMessage('');
        setFrom({ point: { lat: pos.coords.latitude, lon: pos.coords.longitude }, label: 'you' });
      },
      (error) => {
        setFrom(null);
        setMessage(error.code === error.PERMISSION_DENIED ? 'Location is off. Choose a city instead.' : 'Could not find you. Choose a city instead.');
      },
      { timeout: 5000 },
    );
  }

  return (
    <section>
      <h1>Stores</h1>
      <p>
        <button type="button" onClick={locate}>
          Use my location
        </button>{' '}
        <label>
          or choose a city{' '}
          <select
            value=""
            onChange={(e) => {
              setMessage('');
              setFrom({ point: CITIES[e.target.value]!, label: e.target.value });
            }}
          >
            <option value="" disabled>
              City
            </option>
            {Object.keys(CITIES).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </p>
      <p role="status">{message}</p>
      {from && (
        <>
          <h2>Stores nearest to {from.label}</h2>
          <ol aria-label="Nearest stores">
            {nearest(from.point).map((s) => (
              <li key={s.name}>
                {s.name}: {s.km.toFixed(1)} km
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
