import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { json, sendJson } from '../http.ts';

type SettingsData = { displayName: string; theme: 'light' | 'dark'; emailDigest: boolean };

const TOAST_MS = 2000;

export function Settings({ sandbox }: { sandbox: string }) {
  const url = `/api/s/${sandbox}/settings`;
  const settings = useQuery({ queryKey: ['settings', sandbox], queryFn: async () => json<SettingsData>(await fetch(url)) });
  const [form, setForm] = useState<SettingsData | null>(null);
  const [toast, setToast] = useState(0);

  useEffect(() => {
    if (settings.data && !form) setForm(settings.data);
  }, [settings.data, form]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(0), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const save = useMutation({
    mutationFn: async (data: SettingsData) => json<SettingsData>(await fetch(url, sendJson('PUT', data))),
    onSuccess: (saved) => {
      setForm(saved);
      setToast(Date.now());
    },
  });

  if (settings.isError) return <p role="alert">Could not load settings: {settings.error.message}</p>;
  if (!form) return <p>Loading settings…</p>;

  return (
    <section>
      <h1>Settings</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(form);
        }}
      >
        <label>
          Display name{' '}
          <input value={form.displayName} maxLength={40} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
        </label>
        <label>
          Theme{' '}
          <select value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value as SettingsData['theme'] })}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.emailDigest}
            onChange={(e) => setForm({ ...form, emailDigest: e.target.checked })}
          />{' '}
          Email me a daily digest
        </label>
        <button type="submit" disabled={save.isPending}>
          Save settings
        </button>
      </form>
      {save.isError && <p role="alert">Could not save settings: {save.error.message}</p>}
      {toast > 0 && (
        <div role="status" className="toast">
          Settings saved
        </div>
      )}
    </section>
  );
}
