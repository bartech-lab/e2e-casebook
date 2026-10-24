import { useEffect, useState } from 'react';

type Channel = 'email' | 'sms' | 'push';
type Digest = 'daily' | 'weekly' | 'never';
type Settings = { channels: Record<Channel, boolean>; digest: Digest };
const CHANNELS: { id: Channel; label: string }[] = [
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'Text messages' },
  { id: 'push', label: 'Push notifications' },
];
const DIGESTS: { id: Digest; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'never', label: 'Never' },
];
const DEFAULTS: Settings = { channels: { email: true, sms: false, push: false }, digest: 'weekly' };

export function AlertSettings({ sandbox }: { sandbox: string }) {
  const key = `alert-settings-${sandbox}`;
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(key) ?? 'null') ?? {}) };
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(settings));
  }, [key, settings]);

  return (
    <section className="alert-settings">
      <h1>Alert settings</h1>
      <h2>Send alerts by</h2>
      <ul className="switch-list">
        {CHANNELS.map((c) => (
          <li key={c.id}>
            <span id={`switch-${c.id}`}>{c.label}</span>
            <button
              type="button"
              role="switch"
              className="switch"
              aria-checked={settings.channels[c.id]}
              aria-labelledby={`switch-${c.id}`}
              onClick={() => setSettings((s) => ({ ...s, channels: { ...s.channels, [c.id]: !s.channels[c.id] } }))}
            />
          </li>
        ))}
      </ul>
      <fieldset className="digest">
        <legend>Summary email</legend>
        {DIGESTS.map((d) => (
          <label key={d.id}>
            <input type="radio" name="digest" value={d.id} checked={settings.digest === d.id} onChange={() => setSettings((s) => ({ ...s, digest: d.id }))} />
            <span>{d.label}</span>
          </label>
        ))}
      </fieldset>
    </section>
  );
}
