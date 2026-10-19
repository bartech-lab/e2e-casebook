export type Message = { seq: number; name: string; text: string };

export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new HttpError(res.status, body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function createSandbox() {
  return json<{ id: string }>(await fetch('/api/sandboxes', { method: 'POST' }));
}

export async function fetchMessages(sandbox: string) {
  const { messages } = await json<{ messages: Message[] }>(await fetch(`/api/s/${sandbox}/messages`));
  return messages;
}

export async function postMessage(sandbox: string, name: string, text: string) {
  return json<Message>(
    await fetch(`/api/s/${sandbox}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, text }),
    }),
  );
}

export function socketUrl(sandbox: string, name: string, since: number) {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const query = new URLSearchParams({ name, since: String(since) });
  return `${proto}//${location.host}/api/s/${sandbox}/ws?${query}`;
}
