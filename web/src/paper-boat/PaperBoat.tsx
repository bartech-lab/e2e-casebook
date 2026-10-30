import { useEffect, useRef, useState } from 'react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' },
];
const KEY = 'paper-boat-captions';
type Line = { start: number; text: string };

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function PaperBoat() {
  const video = useRef<HTMLVideoElement>(null);
  const [language, setLanguage] = useState(() => localStorage.getItem(KEY) ?? 'off');
  const [caption, setCaption] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    const v = video.current!;
    const tracks = Array.from(v.textTracks);
    for (const t of tracks) t.mode = t.language === language ? 'hidden' : 'disabled';
    const track = tracks.find((t) => t.language === language);
    const element = v.querySelector<HTMLTrackElement>(`track[srclang="${language}"]`);
    if (!track || !element) {
      setCaption('');
      setLines([]);
      setCurrent(null);
      return;
    }
    const update = () => {
      const active = Array.from(track.activeCues ?? []) as VTTCue[];
      setCaption(active.map((c) => c.text).join('\n'));
      setCurrent(active[0] ? active[0].startTime : null);
    };
    const load = () => setLines(Array.from(track.cues ?? []).map((c) => ({ start: c.startTime, text: (c as VTTCue).text })));
    track.addEventListener('cuechange', update);
    element.addEventListener('load', load);
    if (element.readyState === HTMLTrackElement.LOADED) load();
    update();
    return () => {
      track.removeEventListener('cuechange', update);
      element.removeEventListener('load', load);
    };
  }, [language]);

  function choose(code: string) {
    localStorage.setItem(KEY, code);
    setLanguage(code);
  }

  function seek(start: number) {
    video.current!.currentTime = start + 0.05;
  }

  return (
    <section>
      <h1>Paper boat</h1>
      <div className="video-box">
        <video ref={video} src="/media/paper-boat.webm" controls width={480} height={270} preload="auto" aria-label="How to fold a paper boat">
          {LANGUAGES.map((l) => (
            <track key={l.code} kind="captions" srcLang={l.code} label={l.label} src={`/media/paper-boat.${l.code}.vtt`} />
          ))}
        </video>
        <div className="video-caption" role="region" aria-label="Captions">
          {caption}
        </div>
      </div>
      <label>
        Captions{' '}
        <select value={language} onChange={(e) => choose(e.target.value)}>
          <option value="off">Off</option>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      {lines.length > 0 && (
        <ol className="transcript-lines" aria-label="Transcript">
          {lines.map((l) => (
            <li key={l.start}>
              <button type="button" aria-current={current === l.start ? 'true' : undefined} onClick={() => seek(l.start)}>
                {clock(l.start)} {l.text}
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
