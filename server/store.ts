import { DatabaseSync } from 'node:sqlite';

export type Message = { seq: number; name: string; text: string };

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
  `);

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
