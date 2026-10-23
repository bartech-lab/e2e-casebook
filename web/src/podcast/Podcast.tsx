import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

const SECONDS = 30;
const LINES: [number, string][] = [
  [0, 'Welcome to the show.'],
  [10, 'Today we talk about testing audio.'],
  [20, 'Thanks for listening.'],
];
const SPEEDS = [1, 1.5, 2];

function wavUrl() {
  const rate = 8000;
  const samples = rate * SECONDS;
  const buf = new ArrayBuffer(44 + samples);
  const v = new DataView(buf);
  const text = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  text(0, 'RIFF');
  v.setUint32(4, 36 + samples, true);
  text(8, 'WAVEfmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  text(36, 'data');
  v.setUint32(40, samples, true);
  for (let i = 0; i < samples; i++) v.setUint8(44 + i, 128 + Math.round(20 * Math.sin((2 * Math.PI * 220 * i) / rate)));
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const key = (sandbox: string) => `podcast-position:${sandbox}`;

export function Podcast({ sandbox }: { sandbox: string }) {
  const src = useMemo(wavUrl, []);
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => () => URL.revokeObjectURL(src), [src]);

  function seek(t: number) {
    const a = audio.current!;
    a.currentTime = Math.min(SECONDS, Math.max(0, t));
    setTime(a.currentTime);
    localStorage.setItem(key(sandbox), String(a.currentTime));
  }

  function toggle() {
    const a = audio.current!;
    if (a.paused) void a.play();
    else a.pause();
  }

  function onSliderKey(e: KeyboardEvent) {
    const next = { ArrowRight: time + 5, ArrowLeft: time - 5, Home: 0, End: SECONDS }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    seek(next);
  }

  const line = LINES.reduce((at, [start], i) => (time >= start ? i : at), 0);

  return (
    <section>
      <h1>Podcast</h1>
      <audio
        ref={audio}
        src={src}
        preload="auto"
        onLoadedMetadata={() => {
          const saved = Number(localStorage.getItem(key(sandbox)));
          if (saved > 0) seek(saved);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          setTime(e.currentTarget.currentTime);
          localStorage.setItem(key(sandbox), String(e.currentTarget.currentTime));
        }}
      />
      <p>
        <button type="button" onClick={toggle}>
          {playing ? 'Pause' : 'Play'}
        </button>{' '}
        <button type="button" onClick={() => seek(time + 15)}>
          Skip 15 s
        </button>{' '}
        <label>
          Speed{' '}
          <select
            value={speed}
            onChange={(e) => {
              const s = Number(e.target.value);
              setSpeed(s);
              audio.current!.playbackRate = s;
            }}
          >
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
      </p>
      <div
        className="seek"
        role="slider"
        tabIndex={0}
        aria-label="Position"
        aria-valuemin={0}
        aria-valuemax={SECONDS}
        aria-valuenow={Math.floor(time)}
        aria-valuetext={`${clock(time)} of ${clock(SECONDS)}`}
        onKeyDown={onSliderKey}
      >
        <div className="seek-fill" style={{ width: `${(time / SECONDS) * 100}%` }} />
      </div>
      <ol aria-label="Transcript">
        {LINES.map(([start, text], i) => (
          <li key={start} aria-current={i === line ? 'true' : undefined}>
            <button type="button" className="link" onClick={() => seek(start)}>
              {clock(start)}
            </button>{' '}
            {text}
          </li>
        ))}
      </ol>
    </section>
  );
}
