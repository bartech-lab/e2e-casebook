import { useEffect, useSyncExternalStore } from 'react';

const MIN = 40;
const MAX = 208;

const engine = (() => {
  let state = { tempo: 100, playing: false, beats: 0 };
  let timer: ReturnType<typeof setInterval> | undefined;
  const subscribers = new Set<() => void>();
  const set = (next: Partial<typeof state>) => {
    state = { ...state, ...next };
    subscribers.forEach((s) => s());
  };
  const run = () => {
    clearInterval(timer);
    timer = state.playing ? setInterval(() => set({ beats: state.beats + 1 }), 60000 / state.tempo) : undefined;
  };
  return {
    get: () => state,
    subscribe(s: () => void) {
      subscribers.add(s);
      return () => subscribers.delete(s);
    },
    toggle() {
      set(state.playing ? { playing: false } : { playing: true, beats: 0 });
      run();
    },
    setTempo(tempo: number) {
      set({ tempo: Math.min(MAX, Math.max(MIN, tempo)) });
      if (state.playing) run();
    },
    stop() {
      set({ playing: false });
      run();
    },
  };
})();

export function Metronome() {
  const { tempo, playing, beats } = useSyncExternalStore(engine.subscribe, engine.get);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, button, [contenteditable="true"]')) return;
      if (e.key === ' ') {
        e.preventDefault();
        engine.toggle();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        engine.setTempo(engine.get().tempo + (e.key === 'ArrowUp' ? 1 : -1));
      }
    };
    addEventListener('keydown', onKey);
    return () => {
      removeEventListener('keydown', onKey);
      engine.stop();
    };
  }, []);

  return (
    <section>
      <h1>Metronome</h1>
      <label>
        Tempo (beats per minute){' '}
        <input
          type="number"
          min={MIN}
          max={MAX}
          value={tempo}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isInteger(n) && n >= MIN && n <= MAX) engine.setTempo(n);
          }}
        />
      </label>{' '}
      <button type="button" onClick={() => engine.toggle()}>
        {playing ? 'Stop' : 'Start'}
      </button>
      <p role="status">
        {playing ? 'Playing' : 'Stopped'} at {tempo} beats per minute. Beats: {beats}
      </p>
      <p>Space starts and stops; the up and down arrow keys change the tempo.</p>
    </section>
  );
}
