import { json, sendJson } from '../http.ts';

export const STATUSES = ['todo', 'doing', 'done'] as const;
export type Status = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<Status, string> = { todo: 'To do', doing: 'Doing', done: 'Done' };

export type Card = {
  id: number;
  title: string;
  description: string;
  status: Status;
  version: number;
  updatedBy: string;
  dueDate: string | null;
};

export type CardChange = { title?: string; description?: string; status?: Status; dueDate?: string | null };

export const cardsKey = (sandbox: string) => ['cards', sandbox] as const;
export const cardKey = (sandbox: string, id: number) => ['card', sandbox, id] as const;

export async function fetchCards(sandbox: string) {
  return (await json<{ cards: Card[] }>(await fetch(`/api/s/${sandbox}/cards`))).cards;
}

export async function fetchCard(sandbox: string, id: number) {
  return json<Card>(await fetch(`/api/s/${sandbox}/cards/${id}`));
}

export async function createCard(
  sandbox: string,
  input: { title: string; description?: string; dueDate?: string | null },
  by: string,
) {
  return json<Card>(await fetch(`/api/s/${sandbox}/cards`, sendJson('POST', { ...input, by })));
}

export type CreateCardVariant = 'inline' | 'dialog';

export async function fetchFlags(sandbox: string) {
  return json<{ createCard: CreateCardVariant | null; draw: CreateCardVariant | null }>(await fetch(`/api/s/${sandbox}/flags`));
}

export async function patchCard(sandbox: string, id: number, change: CardChange, by: string, ifVersion?: number) {
  const headers: Record<string, string> = ifVersion === undefined ? {} : { 'if-match': `"${ifVersion}"` };
  return json<Card>(await fetch(`/api/s/${sandbox}/cards/${id}`, sendJson('PATCH', { ...change, by }, headers)));
}
