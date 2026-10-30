import type { FastifyInstance } from 'fastify';

type Params = { sandbox: string };
type Query = { q?: string; available?: string; sort?: string };
const BOOKS = [
  { title: '100% Wool: Knitting Basics', year: 2019, available: true },
  { title: 'C++ & Rust for Beginners', year: 2024, available: false },
  { title: 'C# in Practice', year: 2022, available: true },
  { title: 'Łódź in Photographs', year: 2016, available: true },
  { title: 'The #1 Detective Agency', year: 1998, available: false },
  { title: 'One Plus+ One', year: 2011, available: true },
  { title: 'Wool and Weaving', year: 2008, available: false },
];

export function registerCatalogue(scope: FastifyInstance) {
  scope.get<{ Params: Params; Querystring: Query }>('/catalogue', async (req) => {
    const q = (req.query.q ?? '').trim().toLowerCase();
    let books = BOOKS.filter((b) => b.title.toLowerCase().includes(q) && (req.query.available !== '1' || b.available));
    if (req.query.sort === 'newest') books = [...books].sort((a, b) => b.year - a.year);
    else if (req.query.sort === 'title') books = [...books].sort((a, b) => a.title.localeCompare(b.title, 'pl'));
    return { books };
  });
}
