import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { json, sendJson } from '../http.ts';
import { uid } from '../uid.ts';

type Connection = { connected: boolean; email: string | null };

export function Calendar({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const key = ['calendar', sandbox];
  const url = `/api/s/${sandbox}/calendar`;
  const connection = useQuery({ queryKey: key, queryFn: async () => json<Connection>(await fetch(url)) });
  const [message, setMessage] = useState('');
  const state = useRef<string | null>(null);
  const popup = useRef<Window | null>(null);

  useEffect(() => {
    async function onMessage(e: MessageEvent) {
      const data = e.data as { type?: string; state?: string; code?: string; error?: string };
      if (e.origin !== location.origin || e.source !== popup.current || data.type !== 'calendar-auth') return;
      if (!state.current || data.state !== state.current) return;
      state.current = null;
      if (!data.code) {
        setMessage('Calendar not connected.');
        return;
      }
      try {
        await json<Connection>(await fetch(`${url}/connect`, sendJson('POST', { code: data.code })));
        setMessage('');
      } catch {
        setMessage('Calendar not connected.');
      }
      await client.invalidateQueries({ queryKey: key });
    }
    window.addEventListener('message', onMessage);
    const watch = setInterval(() => {
      if (state.current && popup.current?.closed) {
        state.current = null;
        setMessage('Calendar not connected.');
      }
    }, 500);
    return () => {
      window.removeEventListener('message', onMessage);
      clearInterval(watch);
    };
  }, [url]);

  function connect() {
    state.current = uid();
    setMessage('Connecting…');
    popup.current = window.open(`/oauth/authorize.html?sandbox=${sandbox}&state=${state.current}`, 'calendar-sign-in', 'popup,width=480,height=420');
  }

  async function disconnect() {
    await fetch(url, { method: 'DELETE' });
    await client.invalidateQueries({ queryKey: key });
  }

  const c = connection.data;
  return (
    <section>
      <h1>Calendar</h1>
      {c && (
        <p>
          Calendar: {c.connected ? `connected as ${c.email}` : 'not connected'}{' '}
          {c.connected ? (
            <button type="button" onClick={() => void disconnect()}>
              Disconnect
            </button>
          ) : (
            <button type="button" onClick={connect}>
              Connect calendar
            </button>
          )}
        </p>
      )}
      <p role="status">{message}</p>
    </section>
  );
}
