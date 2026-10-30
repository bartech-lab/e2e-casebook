import { useEffect, useState } from 'react';

const CITIES = ['Kraków', 'Gdańsk', 'Zakopane'];
const REFRESH = 10 * 60_000;

type Report = { city: string; tempC: number; sky: string };

export function Weather({ sandbox }: { sandbox: string }) {
  const [city, setCity] = useState('Kraków');
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [report, setReport] = useState<Report | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    const load = () =>
      fetch(`/api/s/${sandbox}/weather?city=${encodeURIComponent(city)}`)
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json() as Promise<Report>;
        })
        .then(
          (d) => {
            if (!live) return;
            setReport(d);
            setFailed(false);
          },
          () => {
            if (!live) return;
            setFailed(true);
          },
        );
    void load();
    const timer = setInterval(() => void load(), REFRESH);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [sandbox, city]);

  const temp = report ? (unit === 'C' ? report.tempC : Math.round((report.tempC * 9) / 5 + 32)) : null;

  return (
    <section className="weather">
      <h1>Weather</h1>
      <label>
        City{' '}
        <select value={city} onChange={(e) => setCity(e.target.value)}>
          {CITIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>{' '}
      <button type="button" aria-pressed={unit === 'F'} onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}>
        Show °F
      </button>
      <p className="weather-report">{report && report.city === city ? `${report.city}: ${temp}°${unit}, ${report.sky}` : 'Loading…'}</p>
      <p role="status">{failed ? 'Weather unavailable. Trying again in 10 minutes.' : ''}</p>
    </section>
  );
}
