import { useEffect, useRef, useState } from 'react';
import { HttpError, json } from '../http.ts';

type Note = { id: number; bytes: number; durationMs: number };
const MAX_MS = 30_000;
const TICK_MS = 100;
const clock = (ms: number) => `${Math.floor(ms / 60_000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;

type Session = { stream: MediaStream; recorder: MediaRecorder; chunks: Blob[]; started: number; timer: ReturnType<typeof setInterval>; audio: AudioContext };

export function VoiceNote({ sandbox }: { sandbox: string }) {
  const url = `/api/s/${sandbox}/voice-notes`;
  const [notes, setNotes] = useState<Note[]>([]);
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [level, setLevel] = useState(0);
  const [message, setMessage] = useState('');
  const session = useRef<Session | null>(null);

  useEffect(() => {
    void (async () => setNotes((await json<{ notes: Note[] }>(await fetch(url))).notes))();
    return () => {
      const s = session.current;
      if (s) {
        clearInterval(s.timer);
        s.stream.getTracks().forEach((t) => t.stop());
        void s.audio.close();
      }
    };
  }, [url]);

  async function start() {
    setMessage('');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const blocked = err instanceof DOMException && err.name === 'NotAllowedError';
      setMessage(blocked ? 'Microphone access is blocked. Allow it in your browser settings to record.' : 'No microphone was found.');
      return;
    }
    const recorder = new MediaRecorder(stream);
    const audio = new AudioContext();
    const analyser = audio.createAnalyser();
    audio.createMediaStreamSource(stream).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    const started = Date.now();
    const timer = setInterval(() => {
      const ms = Date.now() - started;
      setElapsed(ms);
      analyser.getFloatTimeDomainData(samples);
      setLevel(Math.min(100, Math.round(Math.sqrt(samples.reduce((sum, x) => sum + x * x, 0) / samples.length) * 300)));
      if (ms >= MAX_MS) void stop();
    }, TICK_MS);
    session.current = { stream, recorder, chunks, started, timer, audio };
    recorder.start(1000);
    setElapsed(0);
  }

  async function stop() {
    const s = session.current;
    if (!s) return;
    session.current = null;
    clearInterval(s.timer);
    const durationMs = Math.min(MAX_MS, Date.now() - s.started);
    const stopped = new Promise((resolve) => s.recorder.addEventListener('stop', resolve, { once: true }));
    s.recorder.stop();
    await stopped;
    s.stream.getTracks().forEach((t) => t.stop());
    void s.audio.close();
    setElapsed(null);
    setLevel(0);
    try {
      const blob = new Blob(s.chunks, { type: 'audio/webm' });
      const note = await json<Note>(await fetch(`${url}?durationMs=${durationMs}`, { method: 'POST', headers: { 'content-type': 'audio/webm' }, body: blob }));
      setNotes((list) => [...list, note]);
      setMessage(`Saved voice note ${note.id}.`);
    } catch (err) {
      setMessage(err instanceof HttpError ? err.message : 'Could not save the recording.');
    }
  }

  const recording = elapsed !== null;
  return (
    <section>
      <h1>Voice note</h1>
      {recording ? (
        <>
          <p>
            Recording <time data-testid="elapsed">{clock(elapsed)}</time> of {clock(MAX_MS)}
          </p>
          <div role="meter" aria-label="Microphone level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={level} className="level">
            <span style={{ width: `${level}%` }} />
          </div>
          <button type="button" onClick={() => void stop()}>
            Stop
          </button>
        </>
      ) : (
        <button type="button" onClick={() => void start()}>
          Record
        </button>
      )}
      <p role="status">{message}</p>
      <h2>Your voice notes</h2>
      <ul aria-label="Voice notes">
        {notes.map((n) => (
          <li key={n.id}>
            Voice note {n.id}, {clock(n.durationMs)} <audio controls src={`${url}/${n.id}/audio`} aria-label={`Play voice note ${n.id}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}
