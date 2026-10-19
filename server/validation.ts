export const MAX_NAME = 40;
export const MAX_TEXT = 500;

export function messageInput(body: unknown): { name: string; text: string } | null {
  if (typeof body !== 'object' || body === null) return null;
  const { name, text } = body as Record<string, unknown>;
  if (typeof name !== 'string' || typeof text !== 'string') return null;
  const n = name.trim();
  const t = text.trim();
  if (!n || n.length > MAX_NAME || !t || t.length > MAX_TEXT) return null;
  return { name: n, text: t };
}

export const MAX_TITLE = 80;
export const MAX_DESCRIPTION = 1000;
const STATUS_SET = new Set(['todo', 'doing', 'done']);

type Status = 'todo' | 'doing' | 'done';

export function cardInput(body: unknown): { title: string; description: string; status: Status } | null {
  if (typeof body !== 'object' || body === null) return null;
  const { title, description = '', status = 'todo' } = body as Record<string, unknown>;
  if (typeof title !== 'string' || typeof description !== 'string' || typeof status !== 'string') return null;
  const t = title.trim();
  if (!t || t.length > MAX_TITLE || description.length > MAX_DESCRIPTION || !STATUS_SET.has(status)) return null;
  return { title: t, description, status: status as Status };
}

export function cardChange(
  body: unknown,
): { change: { title?: string; description?: string; status?: Status }; by: string } | null {
  if (typeof body !== 'object' || body === null) return null;
  const { title, description, status, by } = body as Record<string, unknown>;
  const change: { title?: string; description?: string; status?: Status } = {};
  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim() || title.trim().length > MAX_TITLE) return null;
    change.title = title.trim();
  }
  if (description !== undefined) {
    if (typeof description !== 'string' || description.length > MAX_DESCRIPTION) return null;
    change.description = description;
  }
  if (status !== undefined) {
    if (typeof status !== 'string' || !STATUS_SET.has(status)) return null;
    change.status = status as Status;
  }
  if (Object.keys(change).length === 0) return null;
  if (by !== undefined && (typeof by !== 'string' || !by.trim() || by.trim().length > MAX_NAME)) return null;
  return { change, by: typeof by === 'string' ? by.trim() : 'anonymous' };
}
