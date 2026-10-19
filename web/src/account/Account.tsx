import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError, json, sendJson } from '../http.ts';

export function Account({ sandbox }: { sandbox: string }) {
  const queryClient = useQueryClient();
  const base = `/api/s/${sandbox}/auth`;
  const invalidLink = new URLSearchParams(location.search).get('error') === 'invalid-link';
  const me = useQuery({
    queryKey: ['me', sandbox],
    queryFn: async () => {
      try {
        return (await json<{ email: string }>(await fetch(`${base}/me`))).email;
      } catch (e) {
        if (e instanceof HttpError && e.status === 401) return null;
        throw e;
      }
    },
  });
  const [sentTo, setSentTo] = useState<string | null>(null);
  const request = useMutation({
    mutationFn: async (email: string) => json(await fetch(`${base}/request`, sendJson('POST', { email }))),
    onSuccess: (_d, email) => setSentTo(email),
  });
  const logout = useMutation({
    mutationFn: async () => json(await fetch(`${base}/logout`, { method: 'POST' })),
    onSuccess: () => queryClient.setQueryData(['me', sandbox], null),
  });

  if (me.isPending) return <p>Loading…</p>;
  if (me.isError) return <p role="alert">Could not check your session: {me.error.message}</p>;

  if (me.data) {
    return (
      <section>
        <h1>Account</h1>
        <p data-testid="signed-in-as">Signed in as {me.data}</p>
        <button type="button" onClick={() => logout.mutate()}>
          Sign out
        </button>
      </section>
    );
  }

  return (
    <section>
      <h1>Sign in</h1>
      {invalidLink && <p role="alert">That sign-in link is invalid or has expired. Request a new one.</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const email = String(new FormData(e.currentTarget).get('email') ?? '');
          request.mutate(email);
        }}
      >
        <label>
          Email <input name="email" type="email" required autoComplete="email" />
        </label>{' '}
        <button type="submit" disabled={request.isPending}>
          Email me a sign-in link
        </button>
      </form>
      {request.isError && <p role="alert">Could not send the link: {request.error.message}</p>}
      {sentTo && <p role="status">We sent a sign-in link to {sentTo}. Open the Mail tab to read it.</p>}
    </section>
  );
}
