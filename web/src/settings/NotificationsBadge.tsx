import { useEffect, useState } from 'react';
import { json } from '../http.ts';

export function NotificationsBadge({ sandbox }: { sandbox: string }) {
  const [unread, setUnread] = useState<number | null>(null);

  useEffect(() => {
    const abort = new AbortController();
    let after: number | undefined;
    (async () => {
      while (!abort.signal.aborted) {
        try {
          const query = after === undefined ? '' : `?after=${after}`;
          const res = await fetch(`/api/s/${sandbox}/notifications${query}`, { signal: abort.signal });
          after = (await json<{ unread: number }>(res)).unread;
          setUnread(after);
        } catch {
          if (abort.signal.aborted) return;
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    })();
    return () => abort.abort();
  }, [sandbox]);

  return <span data-testid="notifications">Notifications: {unread ?? '…'}</span>;
}
