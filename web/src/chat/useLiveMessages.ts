import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMessages, socketUrl, type Message } from './api.ts';
import { lastSeq, mergeMessages } from './merge.ts';

export type ConnectionState = 'connecting' | 'open' | 'closed' | 'gone';

const CLOSE_RESET = 4000;
const CLOSE_UNKNOWN_SANDBOX = 4404;
const RECONNECT_MS = 300;
const SILENCE_LIMIT_MS = 12_000;

export const messagesKey = (sandbox: string) => ['messages', sandbox] as const;

export function useLiveMessages(sandbox: string, name: string | null) {
  const queryClient = useQueryClient();
  const key = messagesKey(sandbox);
  const [state, setState] = useState<ConnectionState>('closed');

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      const history = await fetchMessages(sandbox);
      return mergeMessages(queryClient.getQueryData<Message[]>(key) ?? [], history);
    },
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!name) return;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let lastHeard = 0;

    // Proxies in front of the server (Render's, for one) may not forward close frames,
    // so the client never waits for a close: it drops the socket itself.
    const abandon = (next: ConnectionState) => {
      if (!socket) return;
      socket.onmessage = null;
      socket.onclose = null;
      socket.close();
      socket = undefined;
      setState(next);
      if (next === 'closed') retry = setTimeout(connect, RECONNECT_MS);
    };

    const connect = () => {
      setState('connecting');
      lastHeard = Date.now();
      socket = new WebSocket(socketUrl(sandbox, name, lastSeq(queryClient.getQueryData<Message[]>(key))));
      socket.onmessage = (event) => {
        lastHeard = Date.now();
        const data = JSON.parse(String(event.data));
        if (data.type === 'msg') {
          queryClient.setQueryData<Message[]>(key, (old) => mergeMessages(old ?? [], [data]));
        } else if (data.type === 'ready') {
          setState('open');
        } else if (data.type === 'reset') {
          queryClient.setQueryData<Message[]>(key, []);
          abandon('closed');
        } else if (data.type === 'gone') {
          abandon('gone');
        }
      };
      socket.onclose = (event) => {
        if (event.code === CLOSE_RESET) queryClient.setQueryData<Message[]>(key, []);
        abandon(event.code === CLOSE_UNKNOWN_SANDBOX ? 'gone' : 'closed');
      };
    };

    const watchdog = setInterval(() => {
      if (socket && Date.now() - lastHeard > SILENCE_LIMIT_MS) abandon('closed');
    }, 1000);

    connect();
    return () => {
      clearInterval(watchdog);
      clearTimeout(retry);
      if (socket) {
        socket.onmessage = null;
        socket.onclose = null;
        socket.close();
      }
    };
  }, [sandbox, name, queryClient]);

  return { query, state };
}
