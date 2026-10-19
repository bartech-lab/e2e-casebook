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
