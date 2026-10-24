import { useCallback, useEffect, useState } from 'react';

type Settings = { name: string; setupDone: boolean };
type View = 'loading' | 'setup' | 'dashboard' | 'reports';

export function Workspace({ sandbox }: { sandbox: string }) {
  const url = `/api/s/${sandbox}/workspace`;
  const [view, setView] = useState<View>('loading');
  const [name, setName] = useState('');

  const fetchSettings = useCallback(async () => (await (await fetch(url)).json()) as Settings, [url]);

  useEffect(() => {
    let live = true;
    void fetchSettings().then((s) => {
      if (!live) return;
      setName(s.name);
      setView(s.setupDone ? 'dashboard' : 'setup');
    });
    return () => {
      live = false;
    };
  }, [fetchSettings]);

  useEffect(() => {
    const onFocus = () => void fetchSettings().then((s) => setName(s.name));
    addEventListener('focus', onFocus);
    return () => removeEventListener('focus', onFocus);
  }, [fetchSettings]);

  async function finishSetup() {
    await fetch(`${url}/finish-setup`, { method: 'POST' });
    setView('dashboard');
  }

  return (
    <section>
      <h1>Workspace</h1>
      {view === 'loading' && <p role="status">Loading your workspace…</p>}
      {view === 'setup' && (
        <>
          <h2>Setup</h2>
          <p>Add your opening hours and a logo before you start.</p>
          <button type="button" onClick={() => void finishSetup()}>
            Finish setup
          </button>
        </>
      )}
      {(view === 'dashboard' || view === 'reports') && (
        <>
          <p>{name}</p>
          <nav aria-label="Workspace">
            <button type="button" aria-pressed={view === 'dashboard'} onClick={() => setView('dashboard')}>
              Dashboard
            </button>{' '}
            <button type="button" aria-pressed={view === 'reports'} onClick={() => setView('reports')}>
              Reports
            </button>
          </nav>
          {view === 'dashboard' ? (
            <>
              <h2>Dashboard</h2>
              <p>12 orders today.</p>
            </>
          ) : (
            <>
              <h2>Reports</h2>
              <p>October sales: 18,420 PLN.</p>
            </>
          )}
        </>
      )}
    </section>
  );
}
