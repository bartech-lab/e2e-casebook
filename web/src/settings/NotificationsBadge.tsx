import { useQuery } from '@tanstack/react-query';
import { json } from '../http.ts';

export function NotificationsBadge({ sandbox }: { sandbox: string }) {
  const unread = useQuery({
    queryKey: ['notifications', sandbox],
    queryFn: async () => (await json<{ unread: number }>(await fetch(`/api/s/${sandbox}/notifications`))).unread,
    refetchInterval: 1000,
  });
  return <span data-testid="notifications">Notifications: {unread.data ?? '…'}</span>;
}
