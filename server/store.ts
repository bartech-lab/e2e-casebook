import { DatabaseSync } from 'node:sqlite';

export type Message = { seq: number; name: string; text: string };

export const STATUSES = ['todo', 'doing', 'done'] as const;
export type Status = (typeof STATUSES)[number];
export type Card = {
  id: number;
  title: string;
  description: string;
  status: Status;
  version: number;
  updatedBy: string;
  dueDate: string | null;
};
export type CardInput = { title: string; description?: string; status?: Status; dueDate?: string | null };
export type CardChange = { title?: string; description?: string; status?: Status; dueDate?: string | null };

export const DEFAULT_CARDS: CardInput[] = [
  { title: 'Write the release notes', description: 'Cover the new export and the fixed reconnect.', status: 'todo' },
  { title: 'Fix the login redirect', description: 'Users land on the home page instead of where they started.', status: 'todo' },
  { title: 'Review the pricing page', description: '', status: 'doing' },
  { title: 'Archive old sandboxes', description: 'Anything unused for 24 hours.', status: 'done' },
];

export type Store = ReturnType<typeof openStore>;

export function openStore(path: string) {
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS sandboxes (
      id TEXT PRIMARY KEY,
      last_used INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      sandbox TEXT NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
      seq INTEGER NOT NULL,
      name TEXT NOT NULL,
      text TEXT NOT NULL,
      PRIMARY KEY (sandbox, seq)
    );
    CREATE TABLE IF NOT EXISTS cards (
      sandbox TEXT NOT NULL REFERENCES sandboxes(id) ON DELETE CASCADE,
      id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      version INTEGER NOT NULL,
      updated_by TEXT NOT NULL,
      due_date TEXT,
      PRIMARY KEY (sandbox, id)
    );
  `);
  const cardColumns = 'id, title, description, status, version, updated_by AS updatedBy, due_date AS dueDate';
  const insertCard = db.prepare(`
    INSERT INTO cards (sandbox, id, title, description, status, version, updated_by, due_date)
    VALUES (?, (SELECT COALESCE(MAX(id), 0) + 1 FROM cards WHERE sandbox = ?), ?, ?, ?, 1, ?, ?)
    RETURNING id
  `);
  const selectCardByTitle = db.prepare(
    `SELECT ${'id, title, description, status, version, updated_by AS updatedBy, due_date AS dueDate'} FROM cards WHERE sandbox = ? AND lower(title) = lower(?)`,
  );
  const searchCards = db.prepare(
    `SELECT ${'id, title, description, status, version, updated_by AS updatedBy, due_date AS dueDate'} FROM cards WHERE sandbox = ? AND instr(lower(title), lower(?)) > 0 ORDER BY id`,
  );
  const selectCards = db.prepare(`SELECT ${cardColumns} FROM cards WHERE sandbox = ? ORDER BY id`);
  const selectCard = db.prepare(`SELECT ${cardColumns} FROM cards WHERE sandbox = ? AND id = ?`);
  const updateCard = db.prepare(`
    UPDATE cards SET title = ?, description = ?, status = ?, due_date = ?, version = version + 1, updated_by = ?
    WHERE sandbox = ? AND id = ?
  `);
  const deleteCards = db.prepare('DELETE FROM cards WHERE sandbox = ?');

  function replaceCards(sandbox: string, cards: CardInput[]) {
    deleteCards.run(sandbox);
    for (const c of cards) insertCard.run(sandbox, sandbox, c.title, c.description ?? '', c.status ?? 'todo', 'seed', c.dueDate ?? null);
  }


  const insertSandbox = db.prepare('INSERT INTO sandboxes (id, last_used) VALUES (?, ?)');
  const selectSandbox = db.prepare('SELECT 1 FROM sandboxes WHERE id = ?');
  const touchSandbox = db.prepare('UPDATE sandboxes SET last_used = ? WHERE id = ?');
  const insertMessage = db.prepare(`
    INSERT INTO messages (sandbox, seq, name, text)
    VALUES (?, (SELECT COALESCE(MAX(seq), 0) + 1 FROM messages WHERE sandbox = ?), ?, ?)
    RETURNING seq, name, text
  `);
  const selectSince = db.prepare(
    'SELECT seq, name, text FROM messages WHERE sandbox = ? AND seq > ? ORDER BY seq',
  );
  const deleteMessages = db.prepare('DELETE FROM messages WHERE sandbox = ?');
  const selectStale = db.prepare('SELECT id FROM sandboxes WHERE last_used < ?');
  const deleteStale = db.prepare('DELETE FROM sandboxes WHERE last_used < ?');

  return {
    createSandbox(id: string) {
      insertSandbox.run(id, Date.now());
      replaceCards(id, DEFAULT_CARDS);
    },
    replaceCards,
    listCards(sandbox: string, query?: string) {
      return (query ? searchCards.all(sandbox, query) : selectCards.all(sandbox)) as Card[];
    },
    cardByTitle(sandbox: string, title: string) {
      return selectCardByTitle.get(sandbox, title) as Card | undefined;
    },
    createCard(sandbox: string, input: CardInput, by: string) {
      touchSandbox.run(Date.now(), sandbox);
      const { id } = insertCard.get(
        sandbox,
        sandbox,
        input.title,
        input.description ?? '',
        input.status ?? 'todo',
        by,
        input.dueDate ?? null,
      ) as { id: number };
      return selectCard.get(sandbox, id) as Card;
    },
    getCard(sandbox: string, id: number) {
      return selectCard.get(sandbox, id) as Card | undefined;
    },
    updateCard(sandbox: string, id: number, change: CardChange, by: string) {
      const card = selectCard.get(sandbox, id) as Card | undefined;
      if (!card) return undefined;
      touchSandbox.run(Date.now(), sandbox);
      updateCard.run(
        change.title ?? card.title,
        change.description ?? card.description,
        change.status ?? card.status,
        change.dueDate === undefined ? card.dueDate : change.dueDate,
        by,
        sandbox,
        id,
      );
      return selectCard.get(sandbox, id) as Card;
    },
    hasSandbox(id: string) {
      return selectSandbox.get(id) !== undefined;
    },
    addMessage(sandbox: string, name: string, text: string) {
      touchSandbox.run(Date.now(), sandbox);
      return insertMessage.get(sandbox, sandbox, name, text) as Message;
    },
    messagesSince(sandbox: string, seq: number) {
      return selectSince.all(sandbox, seq) as Message[];
    },
    clearMessages(sandbox: string) {
      deleteMessages.run(sandbox);
    },
    pruneOlderThan(cutoff: number) {
      const ids = (selectStale.all(cutoff) as { id: string }[]).map((r) => r.id);
      deleteStale.run(cutoff);
      return ids;
    },
    close() {
      db.close();
    },
  };
}
