import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { json, sendJson } from '../http.ts';

type Passkey = { id: string; name: string; uses: number };

const b64u = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const bytes = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export function Passkeys({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const key = ['passkeys', sandbox];
  const base = `/api/s/${sandbox}/passkeys`;
  const passkeys = useQuery({ queryKey: key, queryFn: async () => json<Passkey[]>(await fetch(base)) });
  const [signedIn, setSignedIn] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!('PublicKeyCredential' in window))
    return (
      <section>
        <h1>Passkeys</h1>
        <p role="alert">This browser cannot use passkeys here. Passkeys need a secure page, such as https or localhost.</p>
      </section>
    );

  async function run(task: () => Promise<void>, cancelled: string) {
    setBusy(true);
    setMessage('');
    try {
      await task();
    } catch (e) {
      if (e instanceof DOMException && e.name === 'NotAllowedError') setMessage(cancelled);
      else if (e instanceof DOMException && e.name === 'InvalidStateError') setMessage('This device already has a passkey for ann.');
      else setMessage(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
      await client.invalidateQueries({ queryKey: key });
    }
  }

  const create = () =>
    run(async () => {
      const options = await json<{ challenge: string; exclude: string[] }>(await fetch(`${base}/register/options`, { method: 'POST' }));
      const cred = (await navigator.credentials.create({
        publicKey: {
          challenge: bytes(options.challenge),
          rp: { name: 'Casebook', id: location.hostname },
          user: { id: new TextEncoder().encode('ann'), name: 'ann', displayName: 'Ann' },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
          excludeCredentials: options.exclude.map((id) => ({ type: 'public-key', id: bytes(id) })),
          attestation: 'none',
        },
      })) as PublicKeyCredential;
      const response = cred.response as AuthenticatorAttestationResponse;
      await json(
        await fetch(
          `${base}/register`,
          sendJson('POST', { id: cred.id, publicKey: b64u(response.getPublicKey()!), alg: response.getPublicKeyAlgorithm(), clientDataJSON: b64u(response.clientDataJSON) }),
        ),
      );
    }, 'Passkey creation was cancelled.');

  const signIn = () =>
    run(async () => {
      const options = await json<{ challenge: string }>(await fetch(`${base}/login/options`, { method: 'POST' }));
      const cred = (await navigator.credentials.get({
        publicKey: { challenge: bytes(options.challenge), rpId: location.hostname, userVerification: 'required' },
      })) as PublicKeyCredential;
      const response = cred.response as AuthenticatorAssertionResponse;
      const result = await json<{ user: string; passkey: string }>(
        await fetch(
          `${base}/login`,
          sendJson('POST', { id: cred.id, authenticatorData: b64u(response.authenticatorData), clientDataJSON: b64u(response.clientDataJSON), signature: b64u(response.signature) }),
        ),
      );
      setSignedIn(`Signed in as ${result.user} with ${result.passkey}.`);
    }, 'Passkey sign-in was cancelled.');

  return (
    <section>
      <h1>Passkeys</h1>
      <p role="status">{signedIn || 'Signed out.'}</p>
      {message && <p role="alert">{message}</p>}
      <p>
        <button type="button" disabled={busy} onClick={() => void create()}>
          Create a passkey
        </button>{' '}
        {signedIn ? (
          <button type="button" onClick={() => setSignedIn('')}>
            Sign out
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={() => void signIn()}>
            Sign in with a passkey
          </button>
        )}
      </p>
      <h2>Your passkeys</h2>
      <ul aria-label="Your passkeys">
        {passkeys.data?.map((p) => (
          <li key={p.id}>
            {p.name}, used {p.uses} {p.uses === 1 ? 'time' : 'times'}{' '}
            <button
              type="button"
              aria-label={`Remove ${p.name}`}
              onClick={async () => {
                await fetch(`${base}/${encodeURIComponent(p.id)}`, { method: 'DELETE' });
                await client.invalidateQueries({ queryKey: key });
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
