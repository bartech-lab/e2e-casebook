import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Contact = { name: string; email: string };
type RowError = { row: number; message: string };

const EMAIL = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

export function parseCsv(text: string): string[][] {
  const input = text.startsWith('﻿') ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"' && field === '') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export type Contacts = ReturnType<typeof createContacts>;

export function createContacts() {
  const books = new Map<string, Contact[]>();

  function importCsv(sandbox: string, text: string): { imported: number; errors: RowError[] } | null {
    const [header, ...rows] = parseCsv(text);
    if (!header || header.map((h) => h.trim().toLowerCase()).join(',') !== 'name,email') return null;
    const book = books.get(sandbox) ?? [];
    const seen = new Set(book.map((c) => c.email.toLowerCase()));
    const errors: RowError[] = [];
    let imported = 0;
    rows.forEach((fields, i) => {
      const row = i + 2;
      if (fields.length === 1 && fields[0]!.trim() === '') return;
      if (fields.length !== 2) return errors.push({ row, message: 'Wrong number of fields' });
      const name = fields[0]!.trim();
      const email = fields[1]!.trim();
      if (!name || name.length > 80) return errors.push({ row, message: 'Name is missing or too long' });
      if (!EMAIL.test(email)) return errors.push({ row, message: 'Email is invalid' });
      if (seen.has(email.toLowerCase())) return errors.push({ row, message: 'Duplicate email' });
      seen.add(email.toLowerCase());
      book.push({ name, email });
      imported++;
    });
    books.set(sandbox, book);
    return { imported, errors };
  }

  return {
    register(scope: FastifyInstance) {
      scope.addContentTypeParser('text/csv', { parseAs: 'string', bodyLimit: 1024 * 1024 }, (_req, body, done) => done(null, body));

      scope.get<{ Params: Params }>('/contacts', async (req) => ({ contacts: books.get(req.params.sandbox) ?? [] }));

      scope.post<{ Params: Params }>('/contacts/import', async (req, reply) => {
        if (typeof req.body !== 'string') return reply.code(415).send({ error: 'send the file as text/csv' });
        const result = importCsv(req.params.sandbox, req.body);
        return result ?? reply.code(400).send({ error: 'The first row must be: name,email' });
      });
    },
    clear(sandbox: string) {
      books.delete(sandbox);
    },
  };
}
