import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError, json, sendJson } from '../http.ts';

type Role = 'viewer' | 'editor' | 'admin';
type View = { body: string; me: { user: string; role: Role }; members: { name: string; role: Role }[] };
const USERS = ['ann', 'bob', 'cy'];

export function Team({ sandbox }: { sandbox: string }) {
  const client = useQueryClient();
  const [user, setUser] = useState('ann');
  const key = ['team', sandbox, user];
  const base = `/api/s/${sandbox}/team`;
  const headers = { 'x-user': user };
  const team = useQuery({ queryKey: key, queryFn: async () => json<View>(await fetch(base, { headers })) });
  const [draft, setDraft] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  async function send(url: string, body: unknown) {
    try {
      const view = await json<View>(await fetch(url, sendJson('PUT', body, headers)));
      client.setQueryData(key, view);
      setMessage('');
      return true;
    } catch (e) {
      if (e instanceof HttpError && e.status === 403) {
        const role = (e.body as { role?: Role }).role;
        setMessage(`You can no longer do that. Your role is now ${role}.`);
        await client.invalidateQueries({ queryKey: key });
      } else setMessage(e instanceof Error ? e.message : 'Something went wrong.');
      return false;
    }
  }

  async function save() {
    if (await send(`${base}/doc`, { body: draft })) setDraft(null);
  }

  const view = team.data;
  const role = view?.me.role;
  const canEdit = role === 'editor' || role === 'admin';
  const isAdmin = role === 'admin';

  return (
    <section>
      <h1>Team</h1>
      <label>
        Signed in as{' '}
        <select
          value={user}
          onChange={(e) => {
            setUser(e.target.value);
            setDraft(null);
            setMessage('');
          }}
        >
          {USERS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </label>
      {message && <p role="alert">{message}</p>}
      {view && (
        <>
          <h2>Roadmap</h2>
          {draft === null ? (
            <>
              <p className="team-doc">{view.body}</p>
              {canEdit && (
                <button type="button" onClick={() => setDraft(view.body)}>
                  Edit
                </button>
              )}
            </>
          ) : (
            <>
              <label>
                Roadmap text
                <textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} />
              </label>
              <button type="button" onClick={save}>
                Save
              </button>{' '}
              <button type="button" onClick={() => setDraft(null)}>
                Cancel
              </button>
            </>
          )}
          <h2>Members</h2>
          <table>
            <tbody>
              {view.members.map((m) => (
                <tr key={m.name}>
                  <th scope="row">{m.name}</th>
                  <td>
                    {isAdmin ? (
                      <select aria-label={`Role of ${m.name}`} value={m.role} onChange={(e) => void send(`${base}/members/${m.name}`, { role: e.target.value })}>
                        <option>viewer</option>
                        <option>editor</option>
                        <option>admin</option>
                      </select>
                    ) : (
                      m.role
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
