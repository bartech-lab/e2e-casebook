import { json, sendJson } from '../http.ts';

export type Message = { seq: number; name: string; text: string };

export async function createSandbox() {
  return json<{ id: string }>(await fetch('/api/sandboxes', { method: 'POST' }));
}

export async function fetchMessages(sandbox: string) {
  const { messages } = await json<{ messages: Message[] }>(await fetch(`/api/s/${sandbox}/messages`));
  return messages;
}

export async function postMessage(sandbox: string, name: string, text: string) {
  return json<Message>(await fetch(`/api/s/${sandbox}/messages`, sendJson('POST', { name, text })));
}

export async function fetchSandbox(sandbox: string) {
  return json<{ id: string }>(await fetch(`/api/s/${sandbox}`));
}

export function socketUrl(sandbox: string, name: string, since: number) {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const query = new URLSearchParams({ name, since: String(since) });
  return `${proto}//${location.host}/api/s/${sandbox}/ws?${query}`;
}
